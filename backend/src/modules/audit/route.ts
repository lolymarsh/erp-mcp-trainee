import { Router } from "express";
import type { AuditLogHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerAuditLogRoutes(
  handler: AuditLogHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.filter);
  router.get("/detail", auth(), handler.getDetail);

  return router;
}
