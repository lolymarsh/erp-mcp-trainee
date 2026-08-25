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

import { useCustomerList } from './controller';

const mockCustomer = {
  id: 'c1',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  phone: '0812345678',
  email: 'somchai@test.com',
  address: 'Bangkok',
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockCustomer],
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

describe('useCustomerList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches customers on mount', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.post).toHaveBeenCalledWith('/customers/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].firstName).toBe('สมชาย');
    expect(result.current.error).toBeNull();
  });

  it('handles error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.customers).toHaveLength(0);
    expect(result.current.error).toBe('Network error');
  });

  it('sends search filter when setSearch is called', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue(mockFilterResponse);
    act(() => {
      result.current.setSearch('สมชาย');
    });

    await waitFor(
      () =>
        expect(mockApi.post).toHaveBeenLastCalledWith('/customers/filter', {
          page: 1,
          pageSize: 20,
          sortBy: 'desc',
          sortName: 'createdAt',
          filters: [{ field: 'firstName', operator: 'contains', value: 'สมชาย' }],
        }),
      { timeout: 2000 }
    );
  });

  it('refetch works correctly', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [{ ...mockCustomer, firstName: 'สมชาย updated' }],
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
      expect(result.current.customers[0].firstName).toBe('สมชาย updated'),
    );
  });

  it('setPage updates page and refetches', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [mockCustomer],
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
    expect(mockApi.post).toHaveBeenLastCalledWith('/customers/filter', {
      page: 2,
      pageSize: 20,
      sortBy: 'desc',
      sortName: 'createdAt',
    });
  });

  it('handles non-Error catch type', async () => {
    mockApi.post.mockRejectedValue('string error');

    const { result } = renderHook(() => useCustomerList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load customers');
  });
});
