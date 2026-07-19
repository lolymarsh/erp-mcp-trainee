import { Router } from "express";
import type { InvoiceHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerInvoiceRoutes(
  handler: InvoiceHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.filter);
  router.get("/today-summary", auth(), handler.todaySummary);
  router.get("/:id", auth(), handler.getById);
  router.post("/", auth(), handler.create);
  router.patch("/:id/payment-status", auth(), handler.updatePaymentStatus);

  return router;
}
