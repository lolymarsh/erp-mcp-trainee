import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IAuditLogService } from "./service";
import { filterAuditLogSchema, getAuditDetailSchema } from "./schema";
import { sendSuccess, sendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
}

export class AuditLogHandler {
  constructor(private svc: IAuditLogService) {}

  filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterAuditLogSchema.parse(req.body);
      const currentUserId = req.user?.userId ?? "";
      const isAdmin = req.user?.role === "ADMIN";
      const result = await this.svc.filter(input, currentUserId, isAdmin);
      sendSuccess(res, 200, "success", {
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "AuditLog filter failed");
      sendError(res, 500, "Internal server error");
    }
  };

  getDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = getAuditDetailSchema.parse(req.query);
      const currentUserId = req.user?.userId ?? "";
      const isAdmin = req.user?.role === "ADMIN";
      const result = await this.svc.getDetail(
        query.resource_id,
        query.table_name,
        currentUserId,
        isAdmin,
      );
      sendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "AuditLog getDetail failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
