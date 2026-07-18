import { Router } from "express";
import type { ChatHandler } from "./handler";
import type { ReturnedAuthMiddleware } from "../../shared/middleware/auth";

export function registerChatRoutes(
  handler: ChatHandler,
  auth: ReturnedAuthMiddleware,
): Router {
  const router = Router();

  router.post("/send", auth(), handler.sendMessage);
  router.post("/stream", auth(), handler.streamMessage);
  router.get("/history", auth(), handler.getHistory);
  router.post("/export", auth(), handler.exportResult);

  return router;
}
