import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import agentRoutes from './routes/agent';
import clientRoutes from './routes/client';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ─── Security Headers ─────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────
const allowedOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
app.use(
    cors({
        origin: allowedOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// ─── Logging ──────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Rate Limiting on Auth routes ─────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// ─── Routes ───────────────────────────────────────────
app.use('/api/agent/auth', authLimiter, authRoutes);
app.use('/api/agent/clients', clientRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'BetX API is running' });
});

// ─── 404 handler ──────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Centralized Error Handler ────────────────────────
app.use(errorHandler);

export default app;
