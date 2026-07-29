import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IAuditLogService } from "./service";
import { filterAuditLogSchema, getAuditDetailSchema } from "./schema";
import { SendSuccess, SendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
}

export class AuditLogHandler {
  constructor(private svc: IAuditLogService) {}

  Filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterAuditLogSchema.parse(req.body);
      const currentUserId = req.user?.userId ?? "";
      const isAdmin = req.user?.role === "ADMIN";
      const result = await this.svc.Filter(input, currentUserId, isAdmin);
      SendSuccess(res, 200, "success", {
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "AuditLog filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = getAuditDetailSchema.parse(req.query);
      const currentUserId = req.user?.userId ?? "";
      const isAdmin = req.user?.role === "ADMIN";
      const result = await this.svc.GetDetail(
        query.resource_id,
        query.table_name,
        currentUserId,
        isAdmin,
      );
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "AuditLog getDetail failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
