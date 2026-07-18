import { Router } from "express";
import type { InventoryHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function registerInventoryRoutes(
  handler: InventoryHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/products/filter", auth(), handler.filter);
  router.get("/products/:id", auth(), handler.getById);
  router.post("/products", auth(), handler.create);
  router.patch("/products/:id", auth(), handler.update);
  router.delete("/products/:id", auth(), handler.softDelete);
  router.post("/products/:id/stock", auth(), handler.adjustStock);
  router.get("/categories", auth(), handler.listCategories);

  return router;
}
