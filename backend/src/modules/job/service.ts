import type Redis from "ioredis";
import type { IJobRepository } from "./repo";
import type { JobEntity, JobStatus, JobStatusLogEntity } from "./entity";
import type {
  CreateJobInput,
  UpdateJobStatusInput,
  JobResponse,
  JobStatusLogResponse,
  JobWithLogsResponse,
  TodayQueueResponse,
} from "./schema";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { PaginationResponse } from "../../shared/response/handler";
import { CalculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  BadRequestError,
} from "../../shared/errors/AppError";
import type { ICustomerRepository } from "../customer/repo";
import type { IAuditLogService } from "../audit/service";
import type { AuditMeta } from "../../shared/middleware/auditMeta";

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  QUEUED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export interface IJobService {
  Filter(
    input: FilterRequestInput,
  ): Promise<{ data: JobResponse[]; pagination: PaginationResponse }>;
  GetById(id: string): Promise<JobWithLogsResponse>;
  Create(
    input: CreateJobInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<JobWithLogsResponse>;
  UpdateStatus(
    id: string,
    input: UpdateJobStatusInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<{ job: JobResponse; log: JobStatusLogResponse }>;
  GetTodayQueue(): Promise<TodayQueueResponse>;
}

const DASHBOARD_CACHE_KEY = "dashboard:summary";

export class JobService implements IJobService {
  constructor(
    private repo: IJobRepository,
    private customerRepo: ICustomerRepository,
    private redis: Redis,
    private auditService: IAuditLogService,
  ) {}

  async Filter(
    input: FilterRequestInput,
  ): Promise<{ data: JobResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.FindFiltered(input);
    const pagination = CalculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((job) => this.toJobResponse(job)),
      pagination,
    };
  }

  async GetById(id: string): Promise<JobWithLogsResponse> {
    const result = await this.repo.FindByIdWithLogs(id);
    if (!result) {
      throw new NotFoundError("Job not found");
    }

    return {
      ...this.toJobResponse(result.job),
      statusLogs: result.logs.map((log) => this.toLogResponse(log)),
    };
  }

  async Create(
    input: CreateJobInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<JobWithLogsResponse> {
    const customer = await this.customerRepo.FindById(input.customerId);
    if (!customer) {
      throw new BadRequestError("Customer not found");
    }

    const vehicle = await this.customerRepo.FindVehicleById(input.vehicleId);
    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }

    const job = await this.repo.Create({
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      invoiceId: input.invoiceId ?? null,
      jobType: input.jobType,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      technicianId: input.technicianId ?? null,
      notes: input.notes ?? null,
    });

    this.auditService.Insert(
      "CREATE",
      "jobs",
      job.id,
      userId,
      null,
      job,
      meta,
    );

    return {
      ...this.toJobResponse(job),
      statusLogs: [],
    };
  }

  async UpdateStatus(
    id: string,
    input: UpdateJobStatusInput,
    userId: string,
    meta?: AuditMeta,
  ): Promise<{ job: JobResponse; log: JobStatusLogResponse }> {
    const current = await this.repo.FindById(id);
    if (!current) {
      throw new NotFoundError("Job not found");
    }

    if (current.status === input.status) {
      throw new BadRequestError(
        `Job is already in status: ${input.status}`,
      );
    }

    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed.includes(input.status)) {
      throw new BadRequestError(
        `Cannot transition from ${current.status} to ${input.status}. Allowed: ${allowed.join(", ") || "none"}`,
      );
    }

    const result = await this.repo.UpdateStatus(
      id,
      input.status,
      userId,
      input.version,
      input.note ?? null,
    );

    await this.redis.del(DASHBOARD_CACHE_KEY);

    this.auditService.Insert(
      "UPDATE",
      "jobs",
      id,
      userId,
      current,
      result.job,
      meta,
    );

    return {
      job: this.toJobResponse(result.job),
      log: this.toLogResponse(result.log),
    };
  }

  async GetTodayQueue(): Promise<TodayQueueResponse> {
    return this.repo.GetTodayQueue();
  }

  private toJobResponse(entity: JobEntity): JobResponse {
    return {
      id: entity.id,
      customerId: entity.customerId,
      vehicleId: entity.vehicleId,
      invoiceId: entity.invoiceId,
      jobType: entity.jobType,
      status: entity.status,
      scheduledDate:
        entity.scheduledDate instanceof Date
          ? entity.scheduledDate.toISOString()
          : null,
      startTime:
        entity.startTime instanceof Date
          ? entity.startTime.toISOString()
          : null,
      endTime:
        entity.endTime instanceof Date
          ? entity.endTime.toISOString()
          : null,
      technicianId: entity.technicianId,
      notes: entity.notes,
      version: entity.version,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
      updatedAt:
        entity.updatedAt instanceof Date
          ? entity.updatedAt.toISOString()
          : String(entity.updatedAt),
    };
  }

  private toLogResponse(entity: JobStatusLogEntity): JobStatusLogResponse {
    return {
      id: entity.id,
      jobId: entity.jobId,
      fromStatus: entity.fromStatus,
      toStatus: entity.toStatus,
      changedBy: entity.changedBy,
      note: entity.note,
      createdAt:
        entity.createdAt instanceof Date
          ? entity.createdAt.toISOString()
          : String(entity.createdAt),
    };
  }
}
