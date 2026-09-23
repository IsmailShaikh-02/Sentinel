import { Router } from 'express';
import { IncidentsController } from './incidents.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', IncidentsController.list);
router.get('/:id', IncidentsController.getById);

export const incidentRoutes = router;
