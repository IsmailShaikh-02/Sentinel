import { Router } from "express";
import * as incidentController from "../controllers/incidentController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uuidParamSchema } from "../validation.js";

const router = Router();
router.use(requireAuth);

// GET /api/incidents?status=open|all&service_id=<optional>
router.get("/", incidentController.listIncidents);

// GET /api/incidents/services/:id — history for a specific service
router.get(
  "/services/:id/incidents",
  validate(uuidParamSchema, "params"),
  incidentController.getServiceIncidents,
);

export default router;
