import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}));

vi.mock('axios', () => ({
  default: {
    ...mockApi,
    create: vi.fn(() => mockApi),
  },
}));

import { inventoryApi } from './model';

const mockProduct = {
  id: 'p1',
  categoryId: 'cat1',
  sku: 'OIL-001',
  name: 'น้ำมันเครื่อง 5W30',
  description: null,
  unit: 'ลิตร',
  costPrice: '100.00',
  sellPrice: '250.00',
  minStock: 10,
  currentStock: 50,
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockCategory = {
  id: 'cat1',
  name: 'น้ำมันเครื่อง',
  description: null,
};

describe('inventoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filter sends POST to /inventory/products/filter with params', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await inventoryApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/inventory/products/filter',
      { page: 1, pageSize: 20, sortBy: 'desc', sortName: 'createdAt' },
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('น้ำมันเครื่อง 5W30');
  });

  it('filter with search filter sends correct payload', async () => {
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: [mockProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    await inventoryApi.Filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
      filters: [{ field: 'name', operator: 'contains', value: 'น้ำมัน' }],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/inventory/products/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
      filters: [{ field: 'name', operator: 'contains', value: 'น้ำมัน' }],
    });
  });

  it('getById sends GET to /inventory/products/:id with movements', async () => {
    const movement = {
      id: 'm1',
      productId: 'p1',
      type: 'IN' as const,
      quantity: 10,
      referenceType: null,
      referenceId: null,
      createdBy: 'admin',
      note: null,
      createdAt: '2025-01-01T00:00:00Z',
    };
    const apiResponse = {
      data: {
        code: 200,
        message: 'success',
        data: { ...mockProduct, movements: [movement] },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await inventoryApi.GetById('p1');

    expect(mockApi.get).toHaveBeenCalledWith('/inventory/products/p1');
    expect(result.data.movements).toHaveLength(1);
    expect(result.data.movements[0].type).toBe('IN');
  });

  it('create sends POST to /inventory/products', async () => {
    const apiResponse = {
      data: { code: 201, message: 'created', data: mockProduct },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await inventoryApi.Create({
      categoryId: 'cat1',
      sku: 'OIL-001',
      name: 'น้ำมันเครื่อง 5W30',
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/inventory/products',
      { categoryId: 'cat1', sku: 'OIL-001', name: 'น้ำมันเครื่อง 5W30' },
    );
    expect(result.data.sku).toBe('OIL-001');
  });

  it('create with all optional fields sends correct payload', async () => {
    mockApi.post.mockResolvedValue({ data: { code: 201, message: 'created', data: mockProduct } });

    await inventoryApi.Create({
      categoryId: 'cat1',
      sku: 'OIL-001',
      name: 'น้ำมันเครื่อง 5W30',
      description: 'Premium oil',
      unit: 'ลิตร',
      costPrice: 100,
      sellPrice: 250,
      minStock: 10,
      currentStock: 50,
    });

    expect(mockApi.post).toHaveBeenCalledWith('/inventory/products', {
      categoryId: 'cat1',
      sku: 'OIL-001',
      name: 'น้ำมันเครื่อง 5W30',
      description: 'Premium oil',
      unit: 'ลิตร',
      costPrice: 100,
      sellPrice: 250,
      minStock: 10,
      currentStock: 50,
    });
  });

  it('update sends PATCH to /inventory/products/:id with version', async () => {
    const apiResponse = {
      data: { code: 200, message: 'updated', data: { ...mockProduct, name: 'น้ำมันเครื่อง 10W40' } },
    };
    mockApi.patch.mockResolvedValue(apiResponse);

    const result = await inventoryApi.Update('p1', {
      name: 'น้ำมันเครื่อง 10W40',
      version: 1,
    });

    expect(mockApi.patch).toHaveBeenCalledWith(
      '/inventory/products/p1',
      { name: 'น้ำมันเครื่อง 10W40', version: 1 },
    );
    expect(result.data.name).toBe('น้ำมันเครื่อง 10W40');
  });

  it('softDelete sends DELETE to /inventory/products/:id with version', async () => {
    const apiResponse = { data: { code: 200, message: 'deleted' } };
    mockApi.delete.mockResolvedValue(apiResponse);

    const result = await inventoryApi.SoftDelete('p1', { version: 1 });

    expect(mockApi.delete).toHaveBeenCalledWith(
      '/inventory/products/p1',
      { data: { version: 1 } },
    );
    expect(result.message).toBe('deleted');
  });

  it('adjustStock sends POST to /inventory/products/:id/stock for IN type', async () => {
    const adjustResponse = {
      data: {
        code: 200,
        message: 'success',
        data: {
          product: mockProduct,
          movement: {
            id: 'm1',
            productId: 'p1',
            type: 'IN' as const,
            quantity: 10,
            referenceType: 'PURCHASE_ORDER',
            referenceId: 'po1',
            createdBy: 'admin',
            note: 'restock',
            createdAt: '2025-01-01T00:00:00Z',
          },
        },
      },
    };
    mockApi.post.mockResolvedValue(adjustResponse);

    const result = await inventoryApi.AdjustStock('p1', {
      type: 'IN',
      quantity: 10,
      referenceType: 'PURCHASE_ORDER',
      referenceId: 'po1',
      note: 'restock',
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/inventory/products/p1/stock',
      { type: 'IN', quantity: 10, referenceType: 'PURCHASE_ORDER', referenceId: 'po1', note: 'restock' },
    );
    expect(result.data.movement.type).toBe('IN');
  });

  it('adjustStock sends POST for OUT type', async () => {
    const adjustResponse = {
      data: {
        code: 200,
        message: 'success',
        data: {
          product: { ...mockProduct, currentStock: 40 },
          movement: {
            id: 'm2',
            productId: 'p1',
            type: 'OUT' as const,
            quantity: -10,
            referenceType: null,
            referenceId: null,
            createdBy: 'admin',
            note: 'sale',
            createdAt: '2025-01-01T00:00:00Z',
          },
        },
      },
    };
    mockApi.post.mockResolvedValue(adjustResponse);

    const result = await inventoryApi.AdjustStock('p1', {
      type: 'OUT',
      quantity: -10,
      note: 'sale',
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/inventory/products/p1/stock',
      { type: 'OUT', quantity: -10, note: 'sale' },
    );
    expect(result.data.product.currentStock).toBe(40);
  });

  it('listCategories sends GET to /inventory/categories', async () => {
    const apiResponse = {
      data: { code: 200, message: 'success', data: [mockCategory] },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await inventoryApi.ListCategories();

    expect(mockApi.get).toHaveBeenCalledWith('/inventory/categories');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('น้ำมันเครื่อง');
  });

  it('listCategories returns empty array when no categories', async () => {
    const apiResponse = {
      data: { code: 200, message: 'success', data: [] },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await inventoryApi.ListCategories();

    expect(result.data).toHaveLength(0);
  });
});
