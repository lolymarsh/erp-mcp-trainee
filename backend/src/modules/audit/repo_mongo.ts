import type { Db, Collection, Filter, Sort } from "mongodb";
import type { AuditLogDocument } from "./entity";
import type { FilterAuditLogInput, AuditLogFilterItem } from "./schema";

export interface IAuditLogRepository {
  Insert(doc: AuditLogDocument): Promise<void>;
  FindByFilters(filters: FilterAuditLogInput): Promise<AuditLogDocument[]>;
  CountByFilters(filters: FilterAuditLogInput): Promise<number>;
  FindByRecord(
    tableName: string,
    recordId: string,
    limit?: number,
  ): Promise<AuditLogDocument[]>;
}

export class AuditLogRepository implements IAuditLogRepository {
  private collection: Collection<AuditLogDocument>;

  constructor(mongoDb: Db) {
    this.collection = mongoDb.collection<AuditLogDocument>("audit_logs");
  }

  async Insert(doc: AuditLogDocument): Promise<void> {
    await this.collection.insertOne(doc);
  }

  async FindByFilters(
    filters: FilterAuditLogInput,
  ): Promise<AuditLogDocument[]> {
    const query = this.buildFilterQuery(filters.filters ?? []);

    const sortField = filters.sortName ?? "createdAt";
    const sortDir = filters.sortBy === "asc" ? 1 : -1;
    const sort: Sort = { [sortField]: sortDir };

    const skip = (filters.page - 1) * filters.pageSize;
    const projection: Record<string, number> = { changeDatas: 0 };

    return this.collection
      .find(query, { projection, sort })
      .skip(skip)
      .limit(filters.pageSize)
      .toArray();
  }

  async CountByFilters(filters: FilterAuditLogInput): Promise<number> {
    const query = this.buildFilterQuery(filters.filters ?? []);
    return this.collection.countDocuments(query);
  }

  async FindByRecord(
    tableName: string,
    recordId: string,
    limit = 50,
  ): Promise<AuditLogDocument[]> {
    return this.collection
      .find({ tableName, recordId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  private buildFilterQuery(
    items: AuditLogFilterItem[],
  ): Filter<AuditLogDocument> {
    const query: Filter<AuditLogDocument> = {};

    for (const item of items) {
      if (item.field === "table_name" && item.value !== undefined) {
        query.tableName = item.value as string;
      } else if (item.field === "record_id" && item.value !== undefined) {
        query.recordId = item.value as string;
      } else if (item.field === "action" && item.value !== undefined) {
        query.action = item.value as string;
      } else if (item.field === "user_id" && item.value !== undefined) {
        query.userId = item.value as string;
      } else if (item.field === "created_at") {
        const createdAtQuery: Record<string, Date> = {};
        if (item.greater_than !== undefined) {
          createdAtQuery.$gte = new Date(item.greater_than);
        }
        if (item.less_than !== undefined) {
          createdAtQuery.$lte = new Date(item.less_than);
        }
        if (Object.keys(createdAtQuery).length > 0) {
          (query as any).createdAt = createdAtQuery;
        }
      }
    }

    return query;
  }
}
