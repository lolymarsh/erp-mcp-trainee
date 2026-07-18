import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IInvoiceService } from "./service";
import { createInvoiceSchema } from "./schema";
import { filterRequestSchema } from "../../shared/pagination/schema";
import { sendSuccess, sendError } from "../../shared/response/handler";
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

  filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterRequestSchema.parse(req.body);
      const result = await this.svc.filter(input);
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
      logger.error({ err }, "Invoice filter failed");
      sendError(res, 500, "Internal server error");
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const invoice = await this.svc.getById(id);
      sendSuccess(res, 200, "success", { data: invoice });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Invoice getById failed");
      sendError(res, 500, "Internal server error");
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createInvoiceSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const invoice = await this.svc.create(input, userId);
      sendSuccess(res, 201, "created", { data: invoice });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Invoice create failed");
      sendError(res, 500, "Internal server error");
    }
  };

  todaySummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.svc.getTodaySummary();
      sendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Invoice todaySummary failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
