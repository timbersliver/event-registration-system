import { mysqlTable, int, varchar, text, datetime, boolean, timestamp, index } from 'drizzle-orm/mysql-core';

export const events = mysqlTable('events', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  dateTime: datetime('date_time').notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  registrationDeadline: datetime('registration_deadline').notNull(),
  handler: varchar('handler', { length: 255 }).notNull(),
  capacity: int('capacity').notNull().default(0),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  isDeletedIdx: index('is_deleted_idx').on(table.isDeleted),
  dateTimeIdx: index('date_time_idx').on(table.dateTime),
}));

export const registrations = mysqlTable('registrations', {
  id: int('id').primaryKey().autoincrement(),
  eventId: int('event_id').notNull().references(() => events.id),
  email: varchar('email', { length: 255 }).notNull(),
  verificationCode: varchar('verification_code', { length: 6 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  eventIdIdx: index('event_id_idx').on(table.eventId),
  emailIdx: index('email_idx').on(table.email),
  isDeletedIdx: index('reg_is_deleted_idx').on(table.isDeleted),
}));
