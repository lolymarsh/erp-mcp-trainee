import { api } from '../../config/api';

export interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleEntity {
  id: string;
  customerId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  engineType: string | null;
  fuelType: string | null;
}

export interface CustomerWithVehicles extends CustomerEntity {
  vehicles: VehicleEntity[];
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalData: number;
  totalPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterParams {
  page: number;
  pageSize: number;
  sortName?: string;
  sortBy?: 'asc' | 'desc';
  filters?: FilterItem[];
}

export interface FilterItem {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: unknown;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  version: number;
}

export interface DeleteCustomerInput {
  version: number;
}

export const customerApi = {
  filter: async (
    params: FilterParams,
  ): Promise<{
    code: number;
    message: string;
    data: CustomerEntity[];
    pagination: PaginationResponse;
  }> => {
    const { data } = await api.post('/customers/filter', params);
    return data;
  },

  getById: async (
    id: string,
  ): Promise<{
    code: number;
    message: string;
    data: CustomerWithVehicles;
  }> => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  create: async (
    input: CreateCustomerInput,
  ): Promise<{
    code: number;
    message: string;
    data: CustomerEntity;
  }> => {
    const { data } = await api.post('/customers', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateCustomerInput,
  ): Promise<{
    code: number;
    message: string;
    data: CustomerEntity;
  }> => {
    const { data } = await api.patch(`/customers/${id}`, input);
    return data;
  },

  softDelete: async (
    id: string,
    input: DeleteCustomerInput,
  ): Promise<{
    code: number;
    message: string;
  }> => {
    const { data } = await api.delete(`/customers/${id}`, { data: input });
    return data;
  },
};
