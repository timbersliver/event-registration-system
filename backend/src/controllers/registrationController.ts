import { Request, Response } from 'express';
import { db, schema } from '../db';
import { eq, and, lt, gte, count } from 'drizzle-orm';
import { emailService } from '../services/email';
import { cacheService } from '../services/cache';

// In-memory store for verification codes (since we don't have persistent storage for pending verifications)
// In production, use a Redis-backed store
const verificationStore = new Map<string, { code: string; eventId: number; expiresAt: number }>();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    // Generate and store verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    verificationStore.set(`${email}:${eventId}`, { code, eventId, expiresAt });

    // Send email
    const result = await emailService.sendVerificationCode(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        sent: true,
        expiresIn: '10 minutes',
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

    // Verify the code
    const stored = verificationStore.get(`${email}:${eventId}`);
    if (!stored) {
      res.status(400).json({ success: false, message: 'No verification code sent. Please request a new code.' });
      return;
    }

    if (Date.now() > stored.expiresAt) {
      verificationStore.delete(`${email}:${eventId}`);
      res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
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
      verificationCode: code,
      isVerified: true,
    });

    // Clean up verification store
    verificationStore.delete(`${email}:${eventId}`);

    // Invalidate event cache
    await cacheService.del(`event:${eventId}`);
    await cacheService.del('events:list');

    res.status(201).json({ success: true, message: 'Successfully registered for the event' });
  } catch (err) {
    console.error('[RegistrationController] Error registering:', err);
    res.status(500).json({ success: false, message: 'Failed to complete registration' });
  }
}
