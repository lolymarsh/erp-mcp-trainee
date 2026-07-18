import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

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

import { dashboardApi } from './model';
import { useDashboard } from './controller';

const mockSummary = {
  data: {
    data: {
      todaySales: { amount: '15000.00', count: 5 },
      todayJobs: { total: 10, completed: 4, inProgress: 3, queued: 3 },
      lowStockProducts: [
        { id: 'p1', name: 'Oil Filter', current: 2, min: 10 },
      ],
      monthlySales: [
        { month: '2025-01', amount: '300000.00' },
        { month: '2025-02', amount: '450000.00' },
      ],
      topTechnicians: [
        { name: 'Somchai', jobCount: 15, totalAmount: '120000.00' },
      ],
    },
  },
};

describe('dashboardApi', () => {
  it('getSummary sends GET to /dashboard/summary and returns data', async () => {
    mockApi.get.mockResolvedValue(mockSummary);

    const result = await dashboardApi.getSummary();

    expect(mockApi.get).toHaveBeenCalledWith('/dashboard/summary');
    expect(result.todaySales.amount).toBe('15000.00');
    expect(result.todayJobs.total).toBe(10);
    expect(result.lowStockProducts).toHaveLength(1);
    expect(result.monthlySales).toHaveLength(2);
    expect(result.topTechnicians).toHaveLength(1);
  });
});

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and sets summary on mount', async () => {
    mockApi.get.mockResolvedValue(mockSummary);

    const { result, unmount } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.get).toHaveBeenCalledWith('/dashboard/summary');
    expect(result.current.summary).toEqual(mockSummary.data.data);
    expect(result.current.error).toBeNull();
    unmount();
  });

  it('handles errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    const { result, unmount } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBe('Network error');
    unmount();
  });

  it('refetch works and updates data', async () => {
    mockApi.get.mockResolvedValue(mockSummary);

    const { result, unmount } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updatedSummary = {
      data: {
        data: {
          ...mockSummary.data.data,
          todaySales: { amount: '20000.00', count: 7 },
        },
      },
    };
    mockApi.get.mockResolvedValue(updatedSummary);

    result.current.refetch();

    await waitFor(() => expect(result.current.summary?.todaySales.amount).toBe('20000.00'));
    unmount();
  });
});
