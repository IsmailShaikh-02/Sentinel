import { Router } from 'express';
import { ServiceController } from './service.controller.js';
import { AnalyticsController } from '../analytics/analytics.controller.js';
import { IncidentsController } from '../incidents/incidents.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
} from './service.schema.js';
import { uptimeQuerySchema, latencyQuerySchema } from '../analytics/analytics.schema.js';

const router = Router();

router.use(authenticate);

// CRUD
router.post('/', validate(createServiceSchema), ServiceController.create);
router.get('/', ServiceController.list);
router.get('/:id', validate(serviceIdParamSchema), ServiceController.getById);
router.patch('/:id', validate(updateServiceSchema), ServiceController.update);
router.delete('/:id', validate(serviceIdParamSchema), ServiceController.delete);

// Service Incidents
router.get('/:id/incidents', validate(serviceIdParamSchema), IncidentsController.listForService);

// Manual check & Recent checks history
router.post('/:id/check', validate(serviceIdParamSchema), ServiceController.check);
router.get('/:id/checks', validate(serviceIdParamSchema), ServiceController.getRecentChecks);

// Analytical Endpoints (Phase 4)
router.get('/:id/uptime', validate(uptimeQuerySchema), AnalyticsController.getUptime);
router.get('/:id/latency', validate(latencyQuerySchema), AnalyticsController.getLatency);

export const serviceRoutes = router;