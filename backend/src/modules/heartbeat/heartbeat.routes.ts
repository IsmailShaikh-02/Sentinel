import { Router } from "express";
import { HeartbeatController } from "./heartbeat.controller";

const router = Router();

router.post("/:key", HeartbeatController.ping)

export const heartbeatRoutes = router;