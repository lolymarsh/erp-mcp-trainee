import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IInventoryService } from "./service";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  stockAdjustSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "./schema";
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
  if (Array.isArray(id)) return String(id[0]);
  return String(id);
}

export class InventoryHandler {
  constructor(private svc: IInventoryService) {}

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
      logger.error({ err }, "Inventory filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const product = await this.svc.GetById(id);
      SendSuccess(res, 200, "success", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Inventory getById failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createProductSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const product = await this.svc.Create(input, userId, meta);
      SendSuccess(res, 201, "created", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory create failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateProductSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const product = await this.svc.Update(id, input, userId, meta);
      SendSuccess(res, 200, "success", { data: product });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory update failed");
      SendError(res, 500, "Internal server error");
    }
  };

  SoftDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteProductSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.SoftDelete(id, input, userId, meta);
      SendSuccess(res, 200, "deleted");
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory softDelete failed");
      SendError(res, 500, "Internal server error");
    }
  };

  AdjustStock = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = stockAdjustSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.AdjustStock(id, input, userId, meta);
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
      logger.error({ err }, "Inventory adjustStock failed");
      SendError(res, 500, "Internal server error");
    }
  };

  FilterCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterRequestSchema.parse(req.body);
      const result = await this.svc.FilterCategories(input);
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
      logger.error({ err }, "Inventory filterCategories failed");
      SendError(res, 500, "Internal server error");
    }
  };

  ListCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.svc.ListCategories();
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Inventory listCategories failed");
      SendError(res, 500, "Internal server error");
    }
  };

  CreateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createCategorySchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.CreateCategory(input, userId, meta);
      SendSuccess(res, 201, "created", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory createCategory failed");
      SendError(res, 500, "Internal server error");
    }
  };

  UpdateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateCategorySchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.UpdateCategory(id, input, userId, meta);
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
      logger.error({ err }, "Inventory updateCategory failed");
      SendError(res, 500, "Internal server error");
    }
  };

  DeleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteCategorySchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.DeleteCategory(id, input, userId, meta);
      SendSuccess(res, 200, "deleted");
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Inventory deleteCategory failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
