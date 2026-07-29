import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { ICustomerService } from "./service";
import {
  createCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  createVehicleSchema,
  updateVehicleSchema,
  deleteVehicleSchema,
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

export class CustomerHandler {
  constructor(private svc: ICustomerService) {}

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
      logger.error({ err }, "Customer filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const customer = await this.svc.GetById(id);
      SendSuccess(res, 200, "success", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Customer getById failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createCustomerSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const customer = await this.svc.Create(input, userId, meta);
      SendSuccess(res, 201, "created", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Customer create failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateCustomerSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const customer = await this.svc.Update(id, input, userId, meta);
      SendSuccess(res, 200, "success", { data: customer });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Customer update failed");
      SendError(res, 500, "Internal server error");
    }
  };

  SoftDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteCustomerSchema.parse(req.body);
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
      logger.error({ err }, "Customer softDelete failed");
      SendError(res, 500, "Internal server error");
    }
  };

  CreateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createVehicleSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.CreateVehicle(input, userId, meta);
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
      logger.error({ err }, "Customer createVehicle failed");
      SendError(res, 500, "Internal server error");
    }
  };

  UpdateVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateVehicleSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.UpdateVehicle(id, input, userId, meta);
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
      logger.error({ err }, "Customer updateVehicle failed");
      SendError(res, 500, "Internal server error");
    }
  };

  DeleteVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteVehicleSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.DeleteVehicle(id, input, userId, meta);
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
      logger.error({ err }, "Customer deleteVehicle failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
