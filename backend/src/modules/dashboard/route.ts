import { Router } from "express";
import type { DashboardHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerDashboardRoutes(
  handler: DashboardHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.get("/summary", auth(), handler.getSummary);

  return router;
}
