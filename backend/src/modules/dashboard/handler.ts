import type { Request, Response } from "express";
import type { IDashboardService } from "./service";
import { sendSuccess, sendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

export class DashboardHandler {
  constructor(private svc: IDashboardService) {}

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.svc.getSummary();
      sendSuccess(res, 200, "success", { data: summary });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        sendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Dashboard getSummary failed");
      sendError(res, 500, "Internal server error");
    }
  };
}
