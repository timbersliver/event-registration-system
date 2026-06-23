import { Request, Response } from 'express';
import { db, schema } from '../db';
import { eq, and, gte, like, sql, count } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { cacheService } from '../services/cache';
import type { IEvent, IEventWithRegistrationCount } from '../types/event';

const mysqlDialect = new MySqlDialect();

const EVENT_CACHE_PREFIX = 'event:';
const EVENTS_LIST_CACHE_KEY = 'events:list';
const EVENT_CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function getEvents(req: Request, res: Response): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string | undefined;
    const upcoming = req.query.upcoming === 'true';
    const offset = (page - 1) * limit;

    // Try cache for non-filtered requests
    if (!search && !upcoming && page === 1) {
      const cached = await cacheService.get<IEvent[]>(EVENTS_LIST_CACHE_KEY);
      if (cached) {
        res.json({ success: true, message: 'Events retrieved', data: cached });
        return;
      }
    }

    let conditions = [eq(schema.events.isDeleted, false)];

    if (upcoming) {
      conditions.push(gte(schema.events.dateTime, new Date()));
    }

    if (search) {
      conditions.push(like(schema.events.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.events)
      .where(whereClause);

    const total = totalResult?.count ?? 0;

    const events = await db
      .select()
      .from(schema.events)
      .where(whereClause)
      .orderBy(schema.events.dateTime)
      .limit(limit)
      .offset(offset);

    const eventsWithCount: IEventWithRegistrationCount[] = await Promise.all(
      events.map(async (event) => {
        const [regResult] = await db
          .select({ count: count() })
          .from(schema.registrations)
          .where(
            and(
              eq(schema.registrations.eventId, event.id),
              eq(schema.registrations.isVerified, true),
              eq(schema.registrations.isDeleted, false)
            )
          );
        return {
          ...event,
          registrationCount: regResult?.count ?? 0,
          isDeleted: Boolean(event.isDeleted),
        } as IEventWithRegistrationCount;
      })
    );

    // Cache first page results
    if (!search && !upcoming && page === 1) {
      await cacheService.set(EVENTS_LIST_CACHE_KEY, eventsWithCount, EVENT_CACHE_TTL);
    }

    res.json({
      success: true,
      message: 'Events retrieved',
      data: eventsWithCount,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('[EventController] Error fetching events:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    // Check cache
    const cacheKey = `${EVENT_CACHE_PREFIX}${eventId}`;
    const cached = await cacheService.get<IEventWithRegistrationCount>(cacheKey);
    if (cached) {
      res.json({ success: true, message: 'Event retrieved', data: cached });
      return;
    }

    const [event] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const [regResult] = await db
      .select({ count: count() })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, event.id),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      );

    const eventWithCount: IEventWithRegistrationCount = {
      ...event,
      registrationCount: regResult?.count ?? 0,
      isDeleted: Boolean(event.isDeleted),
    };

    // Cache the result
    await cacheService.set(cacheKey, eventWithCount, EVENT_CACHE_TTL);

    res.json({ success: true, message: 'Event retrieved', data: eventWithCount });
  } catch (err) {
    console.error('[EventController] Error fetching event:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, dateTime, address, registrationDeadline, handler, capacity } = req.body;

    const [newEvent] = await db
      .insert(schema.events)
      .values({
        name,
        description,
        dateTime: new Date(dateTime),
        address,
        registrationDeadline: new Date(registrationDeadline),
        handler,
        capacity,
      })
      .$returningId();

    // Invalidate list cache
    await cacheService.del(EVENTS_LIST_CACHE_KEY);

    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, newEvent.id))
      .limit(1);

    res.status(201).json({ success: true, message: 'Event created successfully', data: event });
  } catch (err) {
    console.error('[EventController] Error creating event:', err);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const [existing] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    const fields = ['name', 'description', 'address', 'handler', 'capacity'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    if (req.body.dateTime) updateData.dateTime = new Date(req.body.dateTime);
    if (req.body.registrationDeadline) updateData.registrationDeadline = new Date(req.body.registrationDeadline);

    await db.update(schema.events).set(updateData).where(eq(schema.events.id, eventId));

    // Invalidate caches
    await cacheService.del(`${EVENT_CACHE_PREFIX}${eventId}`);
    await cacheService.del(EVENTS_LIST_CACHE_KEY);

    const [updated] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1);

    res.json({ success: true, message: 'Event updated successfully', data: updated });
  } catch (err) {
    console.error('[EventController] Error updating event:', err);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const [existing] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Soft delete
    await db.update(schema.events).set({ isDeleted: true }).where(eq(schema.events.id, eventId));

    // Invalidate caches
    await cacheService.del(`${EVENT_CACHE_PREFIX}${eventId}`);
    await cacheService.del(EVENTS_LIST_CACHE_KEY);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    console.error('[EventController] Error deleting event:', err);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
}

export async function getEventReport(req: Request, res: Response): Promise<void> {
  try {
    const eventId = parseInt(req.params.eventId, 10);
    if (isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const [event] = await db
      .select()
      .from(schema.events)
      .where(and(eq(schema.events.id, eventId), eq(schema.events.isDeleted, false)))
      .limit(1);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const [verifiedCount] = await db
      .select({ count: count() })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.isVerified, true),
          eq(schema.registrations.isDeleted, false)
        )
      );

    const [pendingCount] = await db
      .select({ count: count() })
      .from(schema.registrations)
      .where(
        and(
          eq(schema.registrations.eventId, eventId),
          eq(schema.registrations.isVerified, false),
          eq(schema.registrations.isDeleted, false)
        )
      );

    res.json({
      success: true,
      message: 'Event report retrieved',
      data: {
        event: {
          ...event,
          isDeleted: Boolean(event.isDeleted),
        },
        totalRegistrations: (verifiedCount?.count ?? 0) + (pendingCount?.count ?? 0),
        verifiedRegistrations: verifiedCount?.count ?? 0,
        pendingRegistrations: pendingCount?.count ?? 0,
        capacityUtilization: event.capacity > 0
          ? Math.round(((verifiedCount?.count ?? 0) / event.capacity) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error('[EventController] Error fetching event report:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event report' });
  }
}

export async function getAllEventsReport(req: Request, res: Response): Promise<void> {
  try {
    const events = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.isDeleted, false))
      .orderBy(schema.events.dateTime) as IEvent[];

    const reportData = await Promise.all(
      events.map(async (event) => {
        const [verifiedCount] = await db
          .select({ count: count() })
          .from(schema.registrations)
          .where(
            and(
              eq(schema.registrations.eventId, event.id),
              eq(schema.registrations.isVerified, true),
              eq(schema.registrations.isDeleted, false)
            )
          );

        const [pendingCount] = await db
          .select({ count: count() })
          .from(schema.registrations)
          .where(
            and(
              eq(schema.registrations.eventId, event.id),
              eq(schema.registrations.isVerified, false),
              eq(schema.registrations.isDeleted, false)
            )
          );

        return {
          id: event.id,
          name: event.name,
          dateTime: event.dateTime,
          handler: event.handler,
          capacity: event.capacity,
          verifiedRegistrations: verifiedCount?.count ?? 0,
          pendingRegistrations: pendingCount?.count ?? 0,
          totalRegistrations: (verifiedCount?.count ?? 0) + (pendingCount?.count ?? 0),
          capacityUtilization: event.capacity > 0
            ? Math.round(((verifiedCount?.count ?? 0) / event.capacity) * 100)
            : 0,
        };
      })
    );

    res.json({ success: true, message: 'Report retrieved', data: reportData });
  } catch (err) {
    console.error('[EventController] Error fetching report:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch report' });
  }
}

export async function getRegistrationAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const period = (req.query.period as string) || '1d';
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : undefined;

    if (eventId !== undefined && isNaN(eventId)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const validPeriods = ['1h', '1d', '1w', '1m'] as const;
    if (!validPeriods.includes(period as typeof validPeriods[number])) {
      res.status(400).json({ success: false, message: 'Invalid period. Use: 1h, 1d, 1w, or 1m' });
      return;
    }

    let intervalSeconds = 0;
    let rangeSeconds = 0;
    let labelFormat: 'time' | 'date' = 'time';

    switch (period) {
      case '1h':
        intervalSeconds = 600;  // 10 min
        rangeSeconds = 3600;    // 1 hour
        labelFormat = 'time';
        break;
      case '1d':
        intervalSeconds = 7200; // 2 hours
        rangeSeconds = 86400;   // 1 day
        labelFormat = 'time';
        break;
      case '1w':
        intervalSeconds = 86400; // 1 day
        rangeSeconds = 604800;   // 7 days
        labelFormat = 'date';
        break;
      case '1m':
        intervalSeconds = 604800; // 7 days (1 week)
        rangeSeconds = 2592000;   // ~30 days
        labelFormat = 'date';
        break;
    }

    // Build the WHERE clause for event filter
    const eventFilter = eventId !== undefined
      ? sql`AND ${schema.registrations.eventId} = ${eventId}`
      : sql``;

    // Use TIMESTAMPDIFF + NOW() — both respect the session timezone (+08:00),
    // so bucket_idx is always the correct age-based offset from "now".
    //   bucket 0 = [now - intervalSeconds, now)
    //   bucket 1 = [now - 2*intervalSeconds, now - intervalSeconds)
    //   ...
    const query = sql`
      SELECT
        TIMESTAMPDIFF(SECOND, created_at, NOW()) DIV ${intervalSeconds} AS bucket_idx,
        COUNT(*) AS count
      FROM registrations
      WHERE created_at >= NOW() - INTERVAL ${rangeSeconds} SECOND
        AND is_deleted = false
        AND is_verified = true
        ${eventFilter}
      GROUP BY bucket_idx
      ORDER BY bucket_idx ASC
    `;

    // Debug purposes - log the generated SQL and params
    // const compiledQuery = mysqlDialect.sqlToQuery(query);
    // console.log('query SQL: ', compiledQuery.sql);
    // console.log('query params: ', compiledQuery.params);

    const [rows] = await db.execute(query) as any[];
    const data = rows as { bucket_idx: number; count: number }[];

    // Build a map from the DB result: bucket_idx → count
    const dataMap = new Map<number, number>();
    for (const row of data) {
      dataMap.set(Number(row.bucket_idx), Number(row.count));
    }

    // Build full time range with gaps filled as zero,
    // ordered oldest → newest (left-to-right chart order)
    const now = new Date();
    const nowMs = now.getTime();
    const numIntervals = Math.ceil(rangeSeconds / intervalSeconds);

    const points = [];
    for (let bucketIdx = numIntervals - 1; bucketIdx >= 0; bucketIdx--) {
      const intervalStartMs = nowMs - (bucketIdx + 1) * intervalSeconds * 1000;
      const intervalEndMs = nowMs - bucketIdx * intervalSeconds * 1000;
      const count = dataMap.get(bucketIdx) || 0;

      const intervalStart = new Date(intervalStartMs);
      const intervalEnd = new Date(intervalEndMs);
      let label: string;

      if (labelFormat === 'time') {
        // Show the START of the bucket window (e.g. "2:58 PM" for [2:58, 3:08))
        label = intervalStart.toLocaleTimeString('en-SG', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Singapore',
        });
      } else {
        // Show the DATE the bucket ends on (e.g. "Jun 23" for today's bucket)
        label = intervalEnd.toLocaleDateString('en-SG', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Singapore',
        });
      }

      points.push({ label, count, timestamp: intervalStart.toISOString() });
    }

    res.json({
      success: true,
      message: 'Analytics retrieved',
      data: {
        period,
        eventId: eventId ?? null,
        intervalSeconds,
        points,
        total: points.reduce((sum, p) => sum + p.count, 0),
      },
    });
  } catch (err) {
    console.error('[EventController] Error fetching analytics:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
}
