// src/modules/alerting/alerts.routes.ts
import { Router } from 'express';
import { AlertsController } from './alerts.controller';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/history', AlertsController.getHistory);
router.get('/channels', AlertsController.getChannels);

export const alertsRoutes = router;
