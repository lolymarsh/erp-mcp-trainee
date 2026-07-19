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

export class UserHandler {
  constructor(private svc: IUserService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = loginSchema.parse(req.body);
      const result = await this.svc.login(input);
      sendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "login failed");
      sendError(res, 500, "Internal server error");
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const profile = await this.svc.getProfile(userId);
      sendSuccess(res, 200, "success", { data: profile });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "getProfile failed");
      sendError(res, 500, "Internal server error");
    }
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.createUser(input, adminUserId, meta);
      sendSuccess(res, 201, "created", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "createUser failed");
      sendError(res, 500, "Internal server error");
    }
  };

  filter = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = filterRequestSchema.parse(req.body);
      const result = await this.svc.filter(input);
      sendSuccess(res, 200, "success", { data: result.data, pagination: result.pagination });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "User filter failed");
      sendError(res, 500, "Internal server error");
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.update(id, input, adminUserId, meta);
      sendSuccess(res, 200, "success", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "User update failed");
      sendError(res, 500, "Internal server error");
    }
  };

  softDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = deleteUserSchema.parse(req.body);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      await this.svc.softDelete(id, input, adminUserId, meta);
      sendSuccess(res, 200, "deleted");
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      if (err instanceof ZodError) {
        sendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "User delete failed");
      sendError(res, 500, "Internal server error");
    }
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const adminUserId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const user = await this.svc.deactivate(id, adminUserId, meta);
      sendSuccess(res, 200, "success", { data: user });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message);
        return;
      }
      logger.error({ err }, "User deactivate failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
