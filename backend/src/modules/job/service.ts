import type Redis from "ioredis";
import type { MySql2Database } from "drizzle-orm/mysql2";
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
import { calculatePagination } from "../../shared/response/handler";
import {
  NotFoundError,
  BadRequestError,
} from "../../shared/errors/AppError";
import type { ICustomerRepository } from "../customer/repo";

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  QUEUED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export interface IJobService {
  filter(
    input: FilterRequestInput,
  ): Promise<{ data: JobResponse[]; pagination: PaginationResponse }>;
  getById(id: string): Promise<JobWithLogsResponse>;
  create(input: CreateJobInput): Promise<JobWithLogsResponse>;
  updateStatus(
    id: string,
    input: UpdateJobStatusInput,
    userId: string,
  ): Promise<{ job: JobResponse; log: JobStatusLogResponse }>;
  getTodayQueue(): Promise<TodayQueueResponse>;
}

const DASHBOARD_CACHE_KEY = "dashboard:summary";

export class JobService implements IJobService {
  constructor(
    private repo: IJobRepository,
    private customerRepo: ICustomerRepository,
    private db: MySql2Database,
    private redis: Redis,
  ) {}

  async filter(
    input: FilterRequestInput,
  ): Promise<{ data: JobResponse[]; pagination: PaginationResponse }> {
    const result = await this.repo.findFiltered(input);
    const pagination = calculatePagination(
      input.page,
      input.pageSize,
      result.total,
    );

    return {
      data: result.data.map((job) => this.toJobResponse(job)),
      pagination,
    };
  }

  async getById(id: string): Promise<JobWithLogsResponse> {
    const result = await this.repo.findByIdWithLogs(id);
    if (!result) {
      throw new NotFoundError("Job not found");
    }

    return {
      ...this.toJobResponse(result.job),
      statusLogs: result.logs.map((log) => this.toLogResponse(log)),
    };
  }

  async create(input: CreateJobInput): Promise<JobWithLogsResponse> {
    const customer = await this.customerRepo.findById(input.customerId);
    if (!customer) {
      throw new BadRequestError("Customer not found");
    }

    const vehicle = await this.customerRepo.findVehicleById(input.vehicleId);
    if (!vehicle) {
      throw new BadRequestError("Vehicle not found");
    }

    const job = await this.repo.create({
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      invoiceId: input.invoiceId ?? null,
      jobType: input.jobType,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      technicianId: input.technicianId ?? null,
      notes: input.notes ?? null,
    });

    return {
      ...this.toJobResponse(job),
      statusLogs: [],
    };
  }

  async updateStatus(
    id: string,
    input: UpdateJobStatusInput,
    userId: string,
  ): Promise<{ job: JobResponse; log: JobStatusLogResponse }> {
    const current = await this.repo.findById(id);
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

    const result = await this.db.transaction(async (tx) => {
      return this.repo.updateStatus(
        id,
        input.status,
        userId,
        input.version,
        input.note ?? null,
        tx,
      );
    });

    await this.redis.del(DASHBOARD_CACHE_KEY);

    return {
      job: this.toJobResponse(result.job),
      log: this.toLogResponse(result.log),
    };
  }

  async getTodayQueue(): Promise<TodayQueueResponse> {
    return this.repo.getTodayQueue();
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
