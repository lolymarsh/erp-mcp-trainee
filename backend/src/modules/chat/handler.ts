import type { Request, Response } from "express";
import { ZodError } from "zod";
import { SendSuccess, SendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";
import { sendMessageSchema } from "./schema";
import type { IChatService } from "./service";

function formatZod(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export class ChatHandler {
  constructor(private svc: IChatService) {}

  SendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = sendMessageSchema.parse(req.body);
      const userId = req.user?.userId ?? "anonymous";
      const sessionId = (req.headers["x-session-id"] as string) ?? "default";
      const result = await this.svc.Ask(input, userId, sessionId);
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        const message = (err.details as { userMessage?: string })?.userMessage ?? err.message;
        SendError(res, err.statusCode, message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZod(err));
        return;
      }
      logger.error({ err }, "chat SendMessage failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req.headers["x-session-id"] as string) ?? "default";
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const history = await this.svc.GetHistory(sessionId, limit);
      SendSuccess(res, 200, "success", { data: history });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "chat GetHistory failed");
      SendError(res, 500, "Internal server error");
    }
  };

  ExportResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = sendMessageSchema.parse(req.body);
      const userId = req.user?.userId ?? "anonymous";
      const sessionId = (req.headers["x-session-id"] as string) ?? "default";
      const result = await this.svc.Ask(input, userId, sessionId);

      const contentType = getContentType(input.format);
      const extension = getExtension(input.format);

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="export_${Date.now()}.${extension}"`,
      );
      res.status(200).send(result.formatted);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        const message = (err.details as { userMessage?: string })?.userMessage ?? err.message;
        SendError(res, err.statusCode, message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZod(err));
        return;
      }
      logger.error({ err }, "chat ExportResult failed");
      SendError(res, 500, "Internal server error");
    }
  };

  ListSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId ?? "anonymous";
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const sessions = await this.svc.ListSessions(userId, limit);
      SendSuccess(res, 200, "success", { data: sessions });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "chat ListSessions failed");
      SendError(res, 500, "Internal server error");
    }
  };

  StreamMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = sendMessageSchema.parse(req.body);
      const userId = req.user?.userId ?? "anonymous";
      const sessionId = (req.headers["x-session-id"] as string) ?? "default";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      sendSSE(res, "start", { question: input.question });

      try {
        const result = await this.svc.Ask(input, userId, sessionId);
        sendSSE(res, "sql_generated", { sql: result.sql });
        sendSSE(res, "result", {
          rows: result.resultCount,
          data: result.data,
        });
        sendSSE(res, "done", {});
      } catch (err: unknown) {
        if (err instanceof AppError) {
          const message = (err.details as { userMessage?: string })?.userMessage ?? err.message;
          sendSSE(res, "error", { code: err.message, message });
          return;
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        sendSSE(res, "error", { code: "LLM_ERROR", message });
      }

      res.end();
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZod(err));
        return;
      }
      logger.error({ err }, "chat StreamMessage failed");
      SendError(res, 500, "Internal server error");
    }
  };
}

function getContentType(format: string): string {
  const types: Record<string, string> = {
    csv: "text/csv",
    html: "text/html",
    json: "application/json",
    text: "text/plain",
    table: "text/plain",
  };
  return types[format] ?? "text/plain";
}

function getExtension(format: string): string {
  const ext: Record<string, string> = {
    csv: "csv",
    html: "html",
    json: "json",
    text: "txt",
    table: "txt",
  };
  return ext[format] ?? "txt";
}

function sendSSE(
  res: Response,
  event: string,
  data: Record<string, unknown>,
): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
