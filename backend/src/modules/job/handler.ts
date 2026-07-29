import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { IJobService } from "./service";
import { createJobSchema, updateJobStatusSchema } from "./schema";
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
  if (Array.isArray(id)) {
    return String(id[0]);
  }
  return String(id);
}

export class JobHandler {
  constructor(private svc: IJobService) {}

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
      logger.error({ err }, "Job Filter failed");
      SendError(res, 500, "Internal server error");
    }
  };

  GetById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const job = await this.svc.GetById(id);
      SendSuccess(res, 200, "success", { data: job });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Job GetById failed");
      SendError(res, 500, "Internal server error");
    }
  };

  Create = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = createJobSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const job = await this.svc.Create(input, userId, meta);
      SendSuccess(res, 201, "created", { data: job });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      if (err instanceof ZodError) {
        SendError(res, 400, formatZodError(err));
        return;
      }
      logger.error({ err }, "Job Create failed");
      SendError(res, 500, "Internal server error");
    }
  };

  UpdateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = extractId(req.params.id);
      const input = updateJobStatusSchema.parse(req.body);
      const userId = req.user?.userId ?? "system";
      const meta = req.auditMeta;
      const result = await this.svc.UpdateStatus(id, input, userId, meta);
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
      if (err instanceof Error && err.message === "VERSION_MISMATCH") {
        SendError(res, 409, "Version mismatch — the job has been updated by another user");
        return;
      }
      if (err instanceof Error && err.message === "JOB_NOT_FOUND") {
        SendError(res, 404, "Job not found");
        return;
      }
      logger.error({ err }, "Job UpdateStatus failed");
      SendError(res, 500, "Internal server error");
    }
  };

  TodayQueue = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.svc.GetTodayQueue();
      SendSuccess(res, 200, "success", { data: result });
    } catch (err: unknown) {
      if (err instanceof AppError) {
        SendError(res, err.statusCode, err.message, err.details);
        return;
      }
      logger.error({ err }, "Job TodayQueue failed");
      SendError(res, 500, "Internal server error");
    }
  };
}
