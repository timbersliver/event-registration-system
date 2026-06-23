import { Router } from 'express';
import { loginSchema, createEventSchema, updateEventSchema } from '../services/validation';
import { validate } from '../middleware/validation';
import { validateAdminCredentials, generateToken } from '../services/auth';
import {
  getAllEventsReport,
  getEventReport,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Admin login API
router.post('/login/api', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  if (!validateAdminCredentials(email, password)) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const token = generateToken(email);
  res.json({ success: true, message: 'Login successful', data: { token, email } });
});

// API Routes
router.get('/api/events', authMiddleware, getEvents);
router.post('/api/events', authMiddleware, validate(createEventSchema), createEvent);
router.put('/api/events/:eventId', authMiddleware, validate(updateEventSchema), updateEvent);
router.delete('/api/events/:eventId', authMiddleware, deleteEvent);
router.get('/api/events/:eventId/report', authMiddleware, getEventReport);
router.get('/api/reports/overview', authMiddleware, getAllEventsReport);

export default router;
