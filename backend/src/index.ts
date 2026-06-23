import 'dotenv/config';
import path from 'path';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// EJS view engine setup for admin pages
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/events', eventRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Event Registration System API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Server] Event Registration System backend running on http://localhost:${PORT}`);
  console.log(`[Server] Admin UI: http://localhost:5173/admin/login`);
  console.log(`[Server] API: http://localhost:${PORT}/api/events`);
});
