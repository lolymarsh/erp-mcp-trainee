import { z } from "zod";

export const auditLogFilterItemSchema = z.object({
  field: z.string().min(1),
  value: z.unknown().optional(),
  greater_than: z.number().optional(),
  less_than: z.number().optional(),
});

export const filterAuditLogSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortName: z.string().optional(),
  sortBy: z.enum(["asc", "desc"]).default("desc"),
  filters: z.array(auditLogFilterItemSchema).optional(),
});

export const getAuditDetailSchema = z.object({
  resource_id: z.string().min(1),
  table_name: z.string().min(1),
});

export type FilterAuditLogInput = z.infer<typeof filterAuditLogSchema>;
export type AuditLogFilterItem = z.infer<typeof auditLogFilterItemSchema>;

export interface ChangeDataResponse {
  field: string;
  old: string;
  new: string;
}

export interface AuditLogResponse {
  _id: string;
  action: string;
  tableName: string;
  recordId: string;
  userId: string;
  userDisplayName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface AuditLogDetailResponse extends AuditLogResponse {
  changeDatas: ChangeDataResponse[];
}

export interface AuditLogListData {
  _id: string;
  action: string;
  tableName: string;
  recordId: string;
  userId: string;
  userDisplayName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}
