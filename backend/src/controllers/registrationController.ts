import { Request, Response } from 'express';
import { db, schema } from '../db';
import { eq, and, count } from 'drizzle-orm';
import { emailService } from '../services/email';
import { cacheService } from '../services/cache';

const VERIFICATION_CODE_EXPIRY = 300; // 5 minutes in seconds
const VERIFICATION_CODE_PREFIX = 'verification:';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function verificationKey(email: string, eventId: number): string {
  return `${VERIFICATION_CODE_PREFIX}${email}:${eventId}`;
}

export async function sendVerificationCode(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    // Check if event exists and is open for registration
    const [event] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      return;
    }

    // Check if already registered
    const [existingRegistration] = await db
      .select({ id: schema.registrations.id })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.email, email),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      )
      .limit(1);

    if (existingRegistration) {
      res.status(400).json({ success: false, message: 'You are already registered for this event' });
      return;
    }

    // Check capacity
    const [regResult] = await db
      .select({ count: count() })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      );

    if ((regResult?.count ?? 0) >= event.capacity) {
      res.status(400).json({ success: false, message: 'Event has reached full capacity' });
      return;
    }

    // Generate and store verification code in Redis with 5-minute expiry
    const code = generateVerificationCode();
    await cacheService.set(verificationKey(email, eventId), { code, eventId }, VERIFICATION_CODE_EXPIRY);

    // Send email
    const result = await emailService.sendVerificationCode(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        sent: true,
        expiresIn: '5 minutes',
        ...(result.previewUrl ? { previewUrl: result.previewUrl } : {}),
      },
    });
  } catch (err) {
    console.error('[RegistrationController] Error sending code:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
}

export async function verifyAndRegister(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    // Check event exists and is open
    const [event] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Verify the code from Redis
    const stored = await cacheService.get<{ code: string; eventId: number }>(verificationKey(email, eventId));
    if (!stored) {
      res.status(400).json({ success: false, message: 'Verification Code is expired, please request a new one' });
      return;
    }

    if (stored.code !== code) {
      res.status(400).json({ success: false, message: 'Invalid verification code' });
      return;
    }

    // Check deadline again
    if (new Date() > new Date(event.registrationDeadline)) {
      res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      return;
    }

    // Final check: ensure not already registered (race condition guard)
    const [existingRegistration] = await db
      .select({ id: schema.registrations.id })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.email, email),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      )
      .limit(1);

    if (existingRegistration) {
      res.status(400).json({ success: false, message: 'You are already registered for this event' });
      return;
    }

    // Check capacity
    const [regResult] = await db
      .select({ count: count() })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      );

    if ((regResult?.count ?? 0) >= event.capacity) {
      res.status(400).json({ success: false, message: 'Event has reached full capacity' });
      return;
    }

    // Insert new registration (always insert new row, never reuse)
    await db.insert(schema.registrations).values({
      eventId,
      email,
      isVerified: true,
    });

    // Clean up verification code from Redis
    await cacheService.del(verificationKey(email, eventId));

    // Invalidate event cache
    await cacheService.del(`event:${eventId}`);
    await cacheService.del('events:list');

    // Send confirmation email (fire-and-forget — don't block response)
    const confirmationPromise = emailService.sendConfirmation(
      email,
      {
        name: event.name,
        dateTime: event.dateTime.toISOString(),
        address: event.address,
        handler: event.handler,
        capacity: event.capacity,
      },
      (regResult?.count ?? 0) + 1
    );

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      data: {
        previewUrl: (await confirmationPromise).previewUrl,
      },
    });
  } catch (err) {
    console.error('[RegistrationController] Error registering:', err);
    res.status(500).json({ success: false, message: 'Failed to complete registration' });
  }
}
