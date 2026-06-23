import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date/time format',
  }),
  address: z.string().min(1, 'Address is required').max(500),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid registration deadline format',
  }),
  handler: z.string().min(1, 'Handler name is required').max(255),
  capacity: z.number().int().positive('Capacity must be a positive number').refine(
    (val) => /^\d+$/.test(String(val)),
    { message: 'Capacity must be a valid integer' }
  ),
});

export const updateEventSchema = createEventSchema.partial();

export const registerForEventSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const eventQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  upcoming: z.string().optional().transform((val) => val === 'true'),
});
