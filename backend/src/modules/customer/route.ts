import { Router } from "express";
import type { CustomerHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function RegisterCustomerRoutes(
  handler: CustomerHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/filter", auth(), handler.Filter);
  router.get("/:id", auth(), handler.GetById);
  router.post("/", auth(), handler.Create);
  router.patch("/:id", auth(), handler.Update);
  router.delete("/:id", auth(), handler.SoftDelete);

  router.post("/vehicles", auth(), handler.CreateVehicle);
  router.patch("/vehicles/:id", auth(), handler.UpdateVehicle);
  router.delete("/vehicles/:id", auth(), handler.DeleteVehicle);

  return router;
}
