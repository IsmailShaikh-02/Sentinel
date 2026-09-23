// src/app.ts
import express from 'express';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { serviceRoutes } from './modules/services/service.routes.js';
import { heartbeatRoutes } from './modules/heartbeat/heartbeat.routes.js';
import { statusRoutes } from './modules/status/status.routes.js';
import { incidentRoutes } from './modules/incidents/incidents.routes.js';
import { generalLimiter } from './middlewares/rate-limit.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global rate limiter applied to all API routes
app.use('/api', generalLimiter);

// Module routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/ping', heartbeatRoutes);
app.use('/api/status', statusRoutes);

// Global error handler MUST be placed last
app.use(errorHandler);

export default app;