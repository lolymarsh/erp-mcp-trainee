import { Router } from "express";
import type { InvoiceHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function RegisterInvoiceRoutes(
  handler: InvoiceHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.Filter);
  router.get("/today-summary", auth(), handler.TodaySummary);
  router.get("/:id", auth(), handler.GetById);
  router.post("/", auth(), handler.Create);
  router.patch("/:id/payment-status", auth(), handler.UpdatePaymentStatus);

  return router;
}
