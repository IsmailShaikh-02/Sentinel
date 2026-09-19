// src/app.ts
import express from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { serviceRoutes } from './modules/services/service.routes.js';
import { heartbeatRoutes } from './modules/heartbeat/heartbeat.routes.js';
import { statusRoutes } from './modules/status/status.routes.js';

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Module routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes)
app.use('/api/ping', heartbeatRoutes)
app.use('/api/status', statusRoutes)
// Global error handler MUST be placed last
app.use(errorHandler);

export default app;