import 'dotenv/config';
import path from 'path';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import eventRoutes from './routes/eventRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 6229;

// Middleware
const allowedOrigins = [
    'http://localhost:6230',
    'http://localhost:5173',
    /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        const ok = allowedOrigins.some((a) =>
            typeof a === 'string' ? a === origin : a.test(origin),
        );
        if (ok || process.env.FRONTEND_URL === origin) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
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
    console.log(`[Server] API: http://localhost:${PORT}/api/events`);
});
