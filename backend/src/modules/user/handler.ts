import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IUserService } from "./service";
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
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

export class UserHandler {
  constructor(private svc: IUserService) {}

  Login = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await this.svc.Login(input);
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Login failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const profile = await this.svc.GetProfile(userId);
      SendSuccess(res, 200, "success", { data: profile });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "GetProfile failed");
      SendError(res, 500, "Internal server error");
    }
  };

  CreateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.CreateUser(input, adminUserId, meta);
      SendSuccess(res, 201, "created", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "CreateUser failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterRequestSchema.parse(req.body);
      const result = await this.svc.Filter(input);
      SendSuccess(res, 200, "success", { data: result.data, pagination: result.pagination });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.Update(id, input, adminUserId, meta);
      SendSuccess(res, 200, "success", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Update failed");
      SendError(res, 500, "Internal server error");
    }
  };

  SoftDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.SoftDelete(id, input, adminUserId, meta);
      SendSuccess(res, 200, "deleted");
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "SoftDelete failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Deactivate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.Deactivate(id, adminUserId, meta);
      SendSuccess(res, 200, "success", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "Deactivate failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
