import { Router } from "express";
import type { JobHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerJobRoutes(
  handler: JobHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.get("/today-queue", auth(), handler.todayQueue);
  router.post("/filter", auth(), handler.filter);
  router.get("/:id", auth(), handler.getById);
  router.post("/", auth(), handler.create);
  router.patch("/:id/status", auth(), handler.updateStatus);

  return router;
}
