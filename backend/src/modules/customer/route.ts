import { Router } from "express";
import type { CustomerHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerCustomerRoutes(
  handler: CustomerHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.filter);
  router.get("/:id", auth(), handler.getById);
  router.post("/", auth(), handler.create);
  router.patch("/:id", auth(), handler.update);
  router.delete("/:id", auth(), handler.softDelete);

  return router;
}
