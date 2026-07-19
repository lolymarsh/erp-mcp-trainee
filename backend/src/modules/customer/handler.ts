import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { ICustomerService } from "./service";
import {
  createCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
} from "./schema";
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
  if (Array.isArray(id)) return String(id[0]);
  return String(id);
}

export class CustomerHandler {
  constructor(private svc: ICustomerService) {}

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
      logger.error({ err }, "Customer filter failed");
      sendError(res, 500, "Internal server error");
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const customer = await this.svc.getById(id);
      sendSuccess(res, 200, "success", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Customer getById failed");
      sendError(res, 500, "Internal server error");
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createCustomerSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const customer = await this.svc.create(input, userId, meta);
      sendSuccess(res, 201, "created", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Customer create failed");
      sendError(res, 500, "Internal server error");
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateCustomerSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const customer = await this.svc.update(id, input, userId, meta);
      sendSuccess(res, 200, "success", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Customer update failed");
      sendError(res, 500, "Internal server error");
    }
  };

  softDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteCustomerSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.softDelete(id, input, userId, meta);
      sendSuccess(res, 200, "deleted");
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Customer softDelete failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
