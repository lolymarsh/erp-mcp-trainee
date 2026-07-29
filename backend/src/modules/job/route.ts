import { Router } from "express";
import type { JobHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function RegisterJobRoutes(
  handler: JobHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.get("/today-queue", auth(), handler.TodayQueue);
  router.post("/filter", auth(), handler.Filter);
  router.get("/:id", auth(), handler.GetById);
  router.post("/", auth(), handler.Create);
  router.patch("/:id/status", auth(), handler.UpdateStatus);

  return router;
}
