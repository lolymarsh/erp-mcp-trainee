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

import { useInvoiceList, useTodaySummary } from './controller';

const mockInvoice = {
  id: 'inv1',
  invoiceNumber: 'INV-2025-001',
  customerId: 'c1',
  vehicleId: null,
  totalAmount: '500.00',
  discount: '0.00',
  tax: '35.00',
  grandTotal: '535.00',
  paymentStatus: 'PENDING' as const,
  paymentMethod: null,
  createdBy: 'admin',
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockInvoice],
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

describe('useInvoiceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches invoices on mount', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInvoiceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.post).toHaveBeenCalledWith('/sales/invoices/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [],
    });
    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].invoiceNumber).toBe('INV-2025-001');
    expect(result.current.error).toBeNull();
  });

  it('handles error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useInvoiceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.invoices).toHaveLength(0);
    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error catch type', async () => {
    mockApi.post.mockRejectedValue('string error');

    const { result } = renderHook(() => useInvoiceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load invoices');
  });

  it('refetch works correctly', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInvoiceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedInvoice = { ...mockInvoice, invoiceNumber: 'INV-2025-002' };
    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [updatedInvoice],
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
      expect(result.current.invoices[0].invoiceNumber).toBe('INV-2025-002'),
    );
  });

  it('setPage updates page and refetches', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useInvoiceList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [mockInvoice],
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

describe('useTodaySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches today summary on mount', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: { totalAmount: '15000.00', count: 5 },
      },
    });

    const { result } = renderHook(() => useTodaySummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.get).toHaveBeenCalledWith('/sales/invoices/today-summary');
    expect(result.current.summary).toEqual({ totalAmount: '15000.00', count: 5 });
    expect(result.current.error).toBeNull();
  });

  it('handles error gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed to load summary'));

    const { result } = renderHook(() => useTodaySummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBe('Failed to load summary');
  });
});
