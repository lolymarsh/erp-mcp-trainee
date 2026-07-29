import type { Request, Response } from "express";
import type { IDashboardService } from "./service";
import { SendSuccess, SendError } from "../../shared/response/handler";
import { AppError } from "../../shared/errors/AppError";
import { logger } from "../../config/logger";

export class DashboardHandler {
  constructor(private svc: IDashboardService) {}

  GetSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.svc.GetSummary();
      SendSuccess(res, 200, "success", { data: summary });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Dashboard GetSummary failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
