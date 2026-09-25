// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authLimiter } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

export const authRoutes = router;