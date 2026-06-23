import { Router } from 'express';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventReport } from '../controllers/eventController';
import { sendVerificationCode, verifyAndRegister } from '../controllers/registrationController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createEventSchema, updateEventSchema, registerForEventSchema, verifyEmailSchema } from '../services/validation';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:eventId', getEvent);

// Public registration routes
router.post('/:eventId/register/send-code', validate(registerForEventSchema), sendVerificationCode);
router.post('/:eventId/register/verify', validate(verifyEmailSchema), verifyAndRegister);

// Admin routes (protected)
router.post('/', authMiddleware, validate(createEventSchema), createEvent);
router.put('/:eventId', authMiddleware, validate(updateEventSchema), updateEvent);
router.delete('/:eventId', authMiddleware, deleteEvent);
router.get('/:eventId/report', authMiddleware, getEventReport);

export default router;
