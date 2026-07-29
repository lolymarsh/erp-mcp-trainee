import { Router } from "express";
import type { ChatHandler } from "./handler";
import type { ReturnedAuthMiddleware } from "../../shared/middleware/auth";

export function RegisterChatRoutes(
  handler: ChatHandler,
  auth: ReturnedAuthMiddleware,
): Router {
  const router = Router();

  router.post("/send", auth(), handler.SendMessage);
  router.post("/stream", auth(), handler.StreamMessage);
  router.get("/history", auth(), handler.GetHistory);
  router.post("/export", auth(), handler.ExportResult);
  router.get("/sessions", auth(), handler.ListSessions);

  return router;
}
