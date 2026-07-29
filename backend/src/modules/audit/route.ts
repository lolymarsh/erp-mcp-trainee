import { Router } from "express";
import type { AuditLogHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function RegisterAuditLogRoutes(
  handler: AuditLogHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.Filter);
  router.get("/detail", auth(), handler.GetDetail);

  return router;
}
