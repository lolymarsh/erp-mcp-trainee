import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IUserService } from "./service";
import { loginSchema, createUserSchema } from "./schema";
import { sendSuccess, sendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
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
      const user = await this.svc.createUser(input);
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
}
