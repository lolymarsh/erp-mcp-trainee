import { api } from '../../config/api';

export interface UserEntity {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive: boolean;
  version: number;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
}

export interface UpdateUserInput {
  displayName?: string;
  role?: 'ADMIN' | 'MANAGER' | 'STAFF' | 'TECHNICIAN';
  isActive?: boolean;
  version: number;
}

export interface DeleteUserInput {
  version: number;
}

export interface FilterParams {
  page: number;
  pageSize: number;
  sortName?: string;
  sortBy?: 'asc' | 'desc';
  filters?: { field: string; operator: string; value: unknown }[];
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  STAFF: 'พนักงาน',
  TECHNICIAN: 'ช่าง',
};

export function GetRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export const userApi = {
  Filter: async (params: FilterParams): Promise<{
    code: number; message: string; data: UserEntity[]; pagination: PaginationResponse;
  }> => {
    const { data } = await api.post('/auth/filter', params);
    return data;
  },

  Create: async (input: CreateUserInput): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.post('/auth', input);
    return data;
  },

  Update: async (id: string, input: UpdateUserInput): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.patch(`/auth/${id}`, input);
    return data;
  },

  SoftDelete: async (id: string, input: DeleteUserInput): Promise<{
    code: number; message: string;
  }> => {
    const { data } = await api.delete(`/auth/${id}`, { data: input });
    return data;
  },

  Deactivate: async (id: string): Promise<{
    code: number; message: string; data: UserEntity;
  }> => {
    const { data } = await api.patch(`/auth/${id}/deactivate`);
    return data;
  },
};
