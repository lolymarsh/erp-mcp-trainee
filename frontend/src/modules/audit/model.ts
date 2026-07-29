import { api } from '../../config/api';

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

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogFilterItem {
  field: string;
  value?: unknown;
  greater_than?: number;
  less_than?: number;
}

export interface AuditLogFilterParams {
  page?: number;
  pageSize?: number;
  sortName?: string;
  sortBy?: 'asc' | 'desc';
  filters?: AuditLogFilterItem[];
}

export const auditApi = {
  GetDetail: async (
    tableName: string,
    recordId: string,
  ): Promise<{
    code: number;
    message: string;
    data: AuditLogDetailResponse[];
  }> => {
    const { data } = await api.get('/audit-log/detail', {
      params: { resource_id: recordId, table_name: tableName },
    });
    return data;
  },

  Filter: async (
    params: AuditLogFilterParams,
  ): Promise<{
    code: number;
    message: string;
    data: AuditLogResponse[];
    pagination: PaginationResponse;
  }> => {
    const { data } = await api.post('/audit-log/filter', params);
    return data;
  },
};
