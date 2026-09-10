import { Router } from "express";
import * as auth from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validation.js";

const router = Router();

router.post("/register", validate(registerSchema), auth.register);
router.post("/login", validate(loginSchema), auth.login);

export default router;