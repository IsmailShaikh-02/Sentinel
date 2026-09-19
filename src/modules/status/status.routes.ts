import { Router } from "express";
import { publicStatusParamSchema } from "./status.schema";
import { StatusPageController } from "./status.controller";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.get('/:userId', validate(publicStatusParamSchema), StatusPageController.getStatus);

export const statusRoutes = router;