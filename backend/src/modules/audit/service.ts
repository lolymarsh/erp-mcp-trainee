import { v4 as uuidv4 } from "uuid";
import type { IAuditLogRepository } from "./repo_mongo";
import type { AuditLogDocument, ChangeModel } from "./entity";
import type {
  FilterAuditLogInput,
  AuditLogResponse,
  AuditLogDetailResponse,
} from "./schema";
import type { AuditMeta } from "../../shared/middleware/auditMeta";
import type { PaginationResponse } from "../../shared/response/handler";
import { CalculatePagination } from "../../shared/response/handler";
import { logger } from "../../config/logger";

const IGNORED_FIELDS = new Set([
  "updatedAt",
  "updated_at",
  "version",
  "updatedBy",
  "updated_by",
]);

const VALID_ACTIONS = new Set(["CREATE", "UPDATE", "DELETE"]);

export interface IAuditLogService {
  Filter(
    input: FilterAuditLogInput,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<{ data: AuditLogResponse[]; pagination: PaginationResponse }>;
  GetDetail(
    resourceId: string,
    tableName: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<AuditLogDetailResponse[]>;
  Insert(
    action: string,
    tableName: string,
    recordId: string,
    userId: string,
    oldData: unknown,
    newData: unknown,
    meta?: AuditMeta,
  ): void;
}

export class AuditLogService implements IAuditLogService {
  constructor(private repo: IAuditLogRepository) {}

  async Filter(
    input: FilterAuditLogInput,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<{ data: AuditLogResponse[]; pagination: PaginationResponse }> {
    if (!isAdmin) {
      const filters = input.filters ?? [];
      const hasUserFilter = filters.some((f) => f.field === "user_id");
      if (!hasUserFilter) {
        filters.push({ field: "user_id", value: currentUserId });
      }
      input.filters = filters;
    }

    const [data, total] = await Promise.all([
      this.repo.FindByFilters(input),
      this.repo.CountByFilters(input),
    ]);

    const pagination = CalculatePagination(input.page, input.pageSize, total);

    return {
      data: data.map((d) => this.toResponse(d)),
      pagination,
    };
  }

  async GetDetail(
    resourceId: string,
    tableName: string,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<AuditLogDetailResponse[]> {
    const records = await this.repo.FindByRecord(tableName, resourceId);

    if (!isAdmin) {
      return this.toDetailResponse(
        records.filter((r) => r.userId === currentUserId),
      );
    }

    return this.toDetailResponse(records);
  }

  Insert(
    action: string,
    tableName: string,
    recordId: string,
    userId: string,
    oldData: unknown,
    newData: unknown,
    meta?: AuditMeta,
  ): void {
    if (!tableName || !recordId) {
      logger.warn({ tableName, recordId }, "skipping audit log: missing fields");
      return;
    }

    if (!VALID_ACTIONS.has(action)) {
      logger.warn({ action }, "skipping audit log: invalid action");
      return;
    }

    const changeDatas = calculateChangedFields(oldData, newData, action);

    if (action === "UPDATE" && changeDatas.length === 0) {
      return;
    }

    const userDisplayName = meta?.userDisplayName ?? null;
    const ipAddress = meta?.ipAddress ?? null;
    const userAgent = meta?.userAgent ?? null;
    const requestId = meta?.requestId ?? null;

    const doc: AuditLogDocument = {
      _id: `ADL_${uuidv4().replace(/-/g, "").slice(0, 20)}`,
      action,
      tableName,
      recordId,
      changeDatas,
      userId,
      userDisplayName,
      ipAddress,
      userAgent,
      requestId,
      createdAt: new Date(),
    };

    setImmediate(async () => {
      try {
        await this.repo.Insert(doc);
      } catch (err: unknown) {
        logger.error({ err }, "Failed to insert audit log");
      }
    });
  }

  private toResponse(doc: AuditLogDocument): AuditLogResponse {
    return {
      _id: doc._id,
      action: doc.action,
      tableName: doc.tableName,
      recordId: doc.recordId,
      userId: doc.userId,
      userDisplayName: doc.userDisplayName,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      requestId: doc.requestId,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  private toDetailResponse(
    docs: AuditLogDocument[],
  ): AuditLogDetailResponse[] {
    return docs.map((d) => ({
      _id: d._id,
      action: d.action,
      tableName: d.tableName,
      recordId: d.recordId,
      userId: d.userId,
      userDisplayName: d.userDisplayName,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      requestId: d.requestId,
      createdAt: d.createdAt.toISOString(),
      changeDatas: d.changeDatas.map((c) => ({
        field: c.field,
        old: c.old,
        new: c.new,
      })),
    }));
  }
}

function structToMap(data: unknown): Record<string, unknown> {
  if (typeof data === "object" && data !== null) {
    return JSON.parse(JSON.stringify(data));
  }
  return {};
}

function calculateChangedFields(
  oldData: unknown,
  newData: unknown,
  action: string,
): ChangeModel[] {
  const oldMap = oldData ? structToMap(oldData) : null;
  const newMap = newData ? structToMap(newData) : null;

  if (action === "CREATE" && newMap) {
    return Object.entries(newMap)
      .filter(([k]) => !IGNORED_FIELDS.has(k))
      .map(([field, val]) => ({ field, old: "", new: String(val ?? "") }));
  }

  if (action === "DELETE" && oldMap) {
    return Object.entries(oldMap)
      .filter(([k]) => !IGNORED_FIELDS.has(k))
      .map(([field, val]) => ({ field, old: String(val ?? ""), new: "" }));
  }

  const changes: ChangeModel[] = [];
  const allKeys = new Set([
    ...Object.keys(oldMap ?? {}),
    ...Object.keys(newMap ?? {}),
  ]);

  for (const key of allKeys) {
    if (IGNORED_FIELDS.has(key)) continue;
    const oldVal = oldMap?.[key];
    const newVal = newMap?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        old: String(oldVal ?? ""),
        new: String(newVal ?? ""),
      });
    }
  }

  return changes;
}
