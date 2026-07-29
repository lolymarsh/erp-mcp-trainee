import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IInvoiceService } from "./service";
import { createInvoiceSchema, updatePaymentStatusSchema } from "./schema";
import { filterRequestSchema } from "../../shared/pagination/schema";
import { SendSuccess, SendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
}

function extractId(id: unknown): string {
  if (Array.isArray(id)) {
    return String(id[0]);
  }
  return String(id);
}

export class InvoiceHandler {
  constructor(private svc: IInvoiceService) {}

  Filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterRequestSchema.parse(req.body);
      const result = await this.svc.Filter(input);
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
      logger.error({ err }, "Invoice filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const invoice = await this.svc.GetById(id);
      SendSuccess(res, 200, "success", { data: invoice });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Invoice getById failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createInvoiceSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const invoice = await this.svc.Create(input, userId, meta);
      SendSuccess(res, 201, "created", { data: invoice });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Invoice create failed");
      SendError(res, 500, "Internal server error");
    }
  };

  UpdatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updatePaymentStatusSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.UpdatePaymentStatus(id, input, userId, meta);
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) { SendError(res, err.statusCode, err.message, err.details); return; }
      if (err instanceof ZodError) { SendError(res, 400, formatZodError(err)); return; }
      logger.error({ err }, "Invoice updatePaymentStatus failed");
      SendError(res, 500, "Internal server error");
    }
  };

  TodaySummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.svc.GetTodaySummary();
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Invoice todaySummary failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
