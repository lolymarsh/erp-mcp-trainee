import {
  eq,
  and,
  like,
  gt,
  gte,
  lt,
  lte,
  ne,
  count,
  inArray,
  asc,
  desc,
} from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { SQL, Column } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { jobs, jobStatusLogs } from "../../config/schema";
import type { JobEntity, JobStatusLogEntity, JobStatus } from "./entity";
import type { FilterRequestInput } from "../../shared/pagination/schema";
import type { Tx } from "../../shared/transaction";

export interface JobWithLogsResult {
  job: JobEntity;
  logs: JobStatusLogEntity[];
}

export interface IJobRepository {
  findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: JobEntity[]; total: number }>;
  findById(id: string): Promise<JobEntity | null>;
  findByIdWithLogs(id: string): Promise<JobWithLogsResult | null>;
  create(data: CreateJobData): Promise<JobEntity>;
  updateStatus(
    id: string,
    newStatus: JobStatus,
    changedBy: string,
    version: number,
    note: string | null,
    tx?: Tx,
  ): Promise<{ job: JobEntity; log: JobStatusLogEntity }>;
  getTodayQueue(): Promise<{
    queued: number;
    inProgress: number;
    completed: number;
  }>;
}

export interface CreateJobData {
  customerId: string;
  vehicleId: string;
  invoiceId: string | null;
  jobType: "INSTALL" | "REPAIR" | "INSPECT";
  scheduledDate: Date | null;
  technicianId: string | null;
  notes: string | null;
}

export class JobRepository implements IJobRepository {
  constructor(private db: MySql2Database) {}

  async findFiltered(
    input: FilterRequestInput,
  ): Promise<{ data: JobEntity[]; total: number }> {
    const conditions = this.buildFilterConditions(input);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ count: count() })
      .from(jobs)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    const orderClause = this.resolveSort(input.sortName, input.sortBy);
    const offset = (input.page - 1) * input.pageSize;

    const rows = await this.db
      .select()
      .from(jobs)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(input.pageSize)
      .offset(offset);

    return { data: rows as JobEntity[], total };
  }

  private buildFilterConditions(input: FilterRequestInput): SQL[] {
    const conditions: SQL[] = [];

    if (!input.filters) {
      return conditions;
    }

    for (const f of input.filters) {
      const col = this.resolveColumn(f.field);
      if (!col) {
        continue;
      }

      const value = String(f.value);
      switch (f.operator) {
        case "eq":
          conditions.push(eq(col, value));
          break;
        case "neq":
          conditions.push(ne(col, value));
          break;
        case "contains":
          conditions.push(like(col, `%${value}%`));
          break;
        case "gt":
          conditions.push(gt(col, value));
          break;
        case "gte":
          conditions.push(gte(col, value));
          break;
        case "lt":
          conditions.push(lt(col, value));
          break;
        case "lte":
          conditions.push(lte(col, value));
          break;
        case "in": {
          const values = Array.isArray(f.value) ? f.value : [f.value];
          conditions.push(inArray(col, values as string[]));
          break;
        }
      }
    }

    return conditions;
  }

  async findById(id: string): Promise<JobEntity | null> {
    const result = await this.db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }
    return result[0] as JobEntity;
  }

  async findByIdWithLogs(id: string): Promise<JobWithLogsResult | null> {
    const job = await this.findById(id);
    if (!job) {
      return null;
    }

    const logs = await this.db
      .select()
      .from(jobStatusLogs)
      .where(eq(jobStatusLogs.jobId, id))
      .orderBy(desc(jobStatusLogs.createdAt));

    return {
      job,
      logs: logs as JobStatusLogEntity[],
    };
  }

  async create(data: CreateJobData): Promise<JobEntity> {
    const id = uuidv4();
    const now = new Date();

    await this.db.insert(jobs).values({
      id,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      invoiceId: data.invoiceId,
      jobType: data.jobType,
      status: "QUEUED",
      scheduledDate: data.scheduledDate,
      startTime: null,
      endTime: null,
      technicianId: data.technicianId,
      notes: data.notes,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      invoiceId: data.invoiceId,
      jobType: data.jobType,
      status: "QUEUED",
      scheduledDate: data.scheduledDate,
      startTime: null,
      endTime: null,
      technicianId: data.technicianId,
      notes: data.notes,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateStatus(
    id: string,
    newStatus: JobStatus,
    changedBy: string,
    version: number,
    note: string | null,
    tx?: Tx,
  ): Promise<{ job: JobEntity; log: JobStatusLogEntity }> {
    const db = tx ?? this.db;
    const [current] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .for("update")
      .limit(1);

    if (!current) {
      throw new Error("JOB_NOT_FOUND");
    }

    if (current.version !== version) {
      throw new Error("VERSION_MISMATCH");
    }

    const newVersion = version + 1;
    const now = new Date();

    const setFields: Record<string, unknown> = {
      status: newStatus,
      version: newVersion,
      updatedAt: now,
    };

    if (newStatus === "IN_PROGRESS" && !current.startTime) {
      setFields.startTime = now;
    }

    if ((newStatus === "COMPLETED" || newStatus === "CANCELLED") && !current.endTime) {
      setFields.endTime = now;
    }

    await db
      .update(jobs)
      .set(setFields)
      .where(and(eq(jobs.id, id), eq(jobs.version, version)));

    const logId = uuidv4();
    const fromStatus = current.status as JobStatus;

    await db.insert(jobStatusLogs).values({
      id: logId,
      jobId: id,
      fromStatus,
      toStatus: newStatus,
      changedBy,
      note,
      createdAt: now,
    });

    const updated: JobEntity = {
      ...(current as JobEntity),
      status: newStatus,
      version: newVersion,
      ...(setFields.startTime ? { startTime: now } : {}),
      ...(setFields.endTime ? { endTime: now } : {}),
      updatedAt: now,
    };

    const log: JobStatusLogEntity = {
      id: logId,
      jobId: id,
      fromStatus,
      toStatus: newStatus,
      changedBy,
      note,
      createdAt: now,
    };

    return { job: updated, log };
  }

  async getTodayQueue(): Promise<{
    queued: number;
    inProgress: number;
    completed: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const result = await this.db
      .select({
        status: jobs.status,
        count: count(),
      })
      .from(jobs)
      .where(
        and(gte(jobs.createdAt, startOfDay), lt(jobs.createdAt, endOfDay)),
      )
      .groupBy(jobs.status);

    let queued = 0;
    let inProgress = 0;
    let completed = 0;

    for (const row of result) {
      switch (row.status) {
        case "QUEUED":
          queued = row.count;
          break;
        case "IN_PROGRESS":
          inProgress = row.count;
          break;
        case "COMPLETED":
          completed = row.count;
          break;
      }
    }

    return { queued, inProgress, completed };
  }

  private resolveColumn(field: string): Column | null {
    switch (field) {
      case "customerId":
        return jobs.customerId;
      case "vehicleId":
        return jobs.vehicleId;
      case "invoiceId":
        return jobs.invoiceId;
      case "jobType":
        return jobs.jobType;
      case "status":
        return jobs.status;
      case "technicianId":
        return jobs.technicianId;
      default:
        return null;
    }
  }

  private resolveSort(
    sortName: string | undefined,
    sortBy: "asc" | "desc",
  ): SQL {
    const sortFn = sortBy === "asc" ? asc : desc;
    switch (sortName) {
      case "status":
        return sortFn(jobs.status);
      case "jobType":
        return sortFn(jobs.jobType);
      case "scheduledDate":
        return sortFn(jobs.scheduledDate);
      case "updatedAt":
        return sortFn(jobs.updatedAt);
      default:
        return sortFn(jobs.createdAt);
    }
  }
}
