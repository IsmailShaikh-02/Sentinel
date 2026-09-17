import { Router } from 'express';
import { ServiceController } from './service.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
} from './service.schema.js';

const router = Router();

// Enforce auth on all service routes
router.use(authenticate);

router.post('/', validate(createServiceSchema), ServiceController.create);
router.get('/', ServiceController.list);
router.get('/:id', validate(serviceIdParamSchema), ServiceController.getById);
router.patch('/:id', validate(updateServiceSchema), ServiceController.update);
router.delete('/:id', validate(serviceIdParamSchema), ServiceController.delete);

export const serviceRoutes = router;