import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

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

import { useInventoryList, useLowStockAlerts } from './controller';

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

const mockFilterResponse = {
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

describe('useInventoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products on mount', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.post).toHaveBeenCalledWith('/inventory/products/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });
    expect(result.current.products).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('sends search filter when setSearch is called', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue(mockFilterResponse);
    act(() => {
      result.current.setSearch('น้ำมัน');
    });

    await waitFor(
      () =>
        expect(mockApi.post).toHaveBeenLastCalledWith('/inventory/products/filter', {
          page: 1,
          pageSize: 20,
          sortBy: 'desc',
          sortName: 'createdAt',
          filters: [{ field: 'name', operator: 'contains', value: 'น้ำมัน' }],
        }),
      { timeout: 2000 },
    );
  });

  it('handles error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error catch type', async () => {
    mockApi.post.mockRejectedValue('string error');

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load products');
  });

  it('refetch works correctly', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedProduct = { ...mockProduct, name: 'น้ำมันเครื่อง 10W40' };
    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [updatedProduct],
        pagination: {
          page: 1,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.products[0].name).toBe('น้ำมันเครื่อง 10W40'),
    );
  });

  it('setPage updates page and refetches', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInventoryList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [mockProduct],
        pagination: {
          page: 2,
          pageSize: 20,
          totalData: 1,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      },
    });

    await act(async () => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(result.current.pagination?.page).toBe(2));
  });
});

describe('useLowStockAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and filters low stock products', async () => {
    const lowStockProduct = { ...mockProduct, currentStock: 5, minStock: 10 };
    const normalProduct = { ...mockProduct, id: 'p2', currentStock: 50, minStock: 10 };

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [lowStockProduct, normalProduct],
        pagination: {
          page: 1,
          pageSize: 100,
          totalData: 2,
          totalPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    const { result } = renderHook(() => useLowStockAlerts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lowStockProducts).toHaveLength(1);
    expect(result.current.lowStockProducts[0].id).toBe('p1');
    expect(result.current.lowStockProducts[0].currentStock).toBe(5);
  });

  it('handles error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Failed to load low stock alerts'));

    const { result } = renderHook(() => useLowStockAlerts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.lowStockProducts).toHaveLength(0);
    expect(result.current.error).toBe('Failed to load low stock alerts');
  });
});
