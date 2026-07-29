import { Router } from "express";
import type { UserHandler } from "./handler";
import type { ReturnedAuthMiddleware } from "../../shared/middleware/auth";

export function RegisterUserRoutes(
  handler: UserHandler,
  auth: ReturnedAuthMiddleware,
): Router {
  const router = Router();

  router.post("/login", handler.Login);
  router.get("/profile", auth(), handler.GetProfile);
  router.post("/", auth("ADMIN"), handler.CreateUser);
  router.post("/filter", auth("ADMIN"), handler.Filter);
  router.patch("/:id", auth("ADMIN"), handler.Update);
  router.delete("/:id", auth("ADMIN"), handler.SoftDelete);
  router.patch("/:id/deactivate", auth("ADMIN"), handler.Deactivate);

  return router;
}
