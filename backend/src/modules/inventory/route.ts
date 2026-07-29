import { Router } from "express";
import type { InventoryHandler } from "./handler";
import type { AuthMiddlewareFn } from "../../shared/middleware/auth";

export function RegisterInventoryRoutes(
  handler: InventoryHandler,
  auth: AuthMiddlewareFn,
): Router {
  const router = Router();

  router.post("/products/filter", auth(), handler.Filter);
  router.get("/products/:id", auth(), handler.GetById);
  router.post("/products", auth(), handler.Create);
  router.patch("/products/:id", auth(), handler.Update);
  router.delete("/products/:id", auth(), handler.SoftDelete);
  router.post("/products/:id/stock", auth(), handler.AdjustStock);
  router.post("/categories/filter", auth(), handler.FilterCategories);
  router.get("/categories", auth(), handler.ListCategories);
  router.post("/categories", auth(), handler.CreateCategory);
  router.patch("/categories/:id", auth(), handler.UpdateCategory);
  router.delete("/categories/:id", auth(), handler.DeleteCategory);

  return router;
}
