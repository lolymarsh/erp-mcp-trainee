import { api } from '../../config/api';

export interface ProductEntity {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  costPrice: string;
  sellPrice: string;
  minStock: number;
  currentStock: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryEntity {
  id: string;
  name: string;
  description: string | null;
}

export interface StockMovementEntity {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  note: string | null;
  createdAt: string;
}

export interface ProductWithMovements extends ProductEntity {
  movements: StockMovementEntity[];
}

export interface StockAdjustResponse {
  product: ProductEntity;
  movement: StockMovementEntity;
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

export interface CreateProductInput {
  categoryId: string;
  sku: string;
  name: string;
  description?: string | null;
  unit?: string;
  costPrice?: number;
  sellPrice?: number;
  minStock?: number;
  currentStock?: number;
}

export interface UpdateProductInput {
  categoryId?: string;
  sku?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  costPrice?: number;
  sellPrice?: number;
  minStock?: number;
  version: number;
}

export interface DeleteProductInput {
  version: number;
}

export interface StockAdjustInput {
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
}

export const inventoryApi = {
  filter: async (
    params: FilterParams,
  ): Promise<{
    code: number;
    message: string;
    data: ProductEntity[];
    pagination: PaginationResponse;
  }> => {
    const { data } = await api.post('/inventory/products/filter', params);
    return data;
  },

  getById: async (
    id: string,
  ): Promise<{
    code: number;
    message: string;
    data: ProductWithMovements;
  }> => {
    const { data } = await api.get(`/inventory/products/${id}`);
    return data;
  },

  create: async (
    input: CreateProductInput,
  ): Promise<{
    code: number;
    message: string;
    data: ProductEntity;
  }> => {
    const { data } = await api.post('/inventory/products', input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateProductInput,
  ): Promise<{
    code: number;
    message: string;
    data: ProductEntity;
  }> => {
    const { data } = await api.patch(`/inventory/products/${id}`, input);
    return data;
  },

  softDelete: async (
    id: string,
    input: DeleteProductInput,
  ): Promise<{
    code: number;
    message: string;
  }> => {
    const { data } = await api.delete(`/inventory/products/${id}`, { data: input });
    return data;
  },

  adjustStock: async (
    id: string,
    input: StockAdjustInput,
  ): Promise<{
    code: number;
    message: string;
    data: StockAdjustResponse;
  }> => {
    const { data } = await api.post(`/inventory/products/${id}/stock`, input);
    return data;
  },

  listCategories: async (): Promise<{
    code: number;
    message: string;
    data: CategoryEntity[];
  }> => {
    const { data } = await api.get('/inventory/categories');
    return data;
  },
};
