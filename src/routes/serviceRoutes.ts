import { Router } from "express";
import * as svc from "../controllers/serviceController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createServiceSchema, updateServiceSchema, uuidParamSchema } from "../validation.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(createServiceSchema), svc.createService);
router.get("/", svc.listServices);
router.get("/:id", validate(uuidParamSchema, "params"), svc.getService);
router.patch("/:id", validate(uuidParamSchema, "params"), validate(updateServiceSchema), svc.updateService);
router.delete("/:id", validate(uuidParamSchema, "params"), svc.deleteService);
router.post("/:id/check", validate(uuidParamSchema, "params"), svc.manualCheck);
router.get("/:id/status", validate(uuidParamSchema, "params"), svc.serviceStatus)

export default router;