import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IInventoryService } from "./service";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  stockAdjustSchema,
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

export class InventoryHandler {
  constructor(private svc: IInventoryService) {}

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
      logger.error({ err }, "Inventory filter failed");
      sendError(res, 500, "Internal server error");
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const product = await this.svc.getById(id);
      sendSuccess(res, 200, "success", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Inventory getById failed");
      sendError(res, 500, "Internal server error");
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createProductSchema.parse(req.body);
      const product = await this.svc.create(input);
      sendSuccess(res, 201, "created", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory create failed");
      sendError(res, 500, "Internal server error");
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateProductSchema.parse(req.body);
      const product = await this.svc.update(id, input);
      sendSuccess(res, 200, "success", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory update failed");
      sendError(res, 500, "Internal server error");
    }
  };

  softDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteProductSchema.parse(req.body);
      await this.svc.softDelete(id, input);
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
      logger.error({ err }, "Inventory softDelete failed");
      sendError(res, 500, "Internal server error");
    }
  };

  adjustStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = stockAdjustSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const result = await this.svc.adjustStock(id, input, userId);
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
      logger.error({ err }, "Inventory adjustStock failed");
      sendError(res, 500, "Internal server error");
    }
  };

  listCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.svc.listCategories();
      sendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Inventory listCategories failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
