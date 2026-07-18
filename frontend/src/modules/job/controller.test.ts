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

import { useJobQueue, useJobDetail, useStatusUpdate, useTodayQueue } from './controller';

const mockJob = {
  id: 'j1',
  customerId: 'c1',
  vehicleId: 'v1',
  invoiceId: null,
  jobType: 'INSTALL' as const,
  status: 'QUEUED' as const,
  scheduledDate: null,
  startTime: null,
  endTime: null,
  technicianId: null,
  notes: null,
  version: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockJob],
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

describe('useJobQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches jobs on mount', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.post).toHaveBeenCalledWith('/jobs/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [],
    });
    expect(result.current.jobs).toHaveLength(1);
    expect(result.current.jobs[0].jobType).toBe('INSTALL');
    expect(result.current.error).toBeNull();
  });

  it('handles error gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.jobs).toHaveLength(0);
    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error catch type', async () => {
    mockApi.post.mockRejectedValue('string error');

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load jobs');
  });

  it('setStatusFilter filters jobs by status', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue(mockFilterResponse);
    await act(async () => {
      result.current.setStatusFilter('IN_PROGRESS');
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.post).toHaveBeenLastCalledWith('/jobs/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [{ field: 'status', operator: 'eq', value: 'IN_PROGRESS' }],
    });
    expect(result.current.statusFilter).toBe('IN_PROGRESS');
  });

  it('setStatusFilter with null clears filter', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setStatusFilter(null);
    });

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenLastCalledWith('/jobs/filter', {
        page: 1,
        pageSize: 20,
        sortBy: 'desc',
        filters: [],
      });
    });
    expect(result.current.statusFilter).toBeNull();
  });

  it('refetch works correctly', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useJobQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [{ ...mockJob, status: 'IN_PROGRESS' }],
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
      expect(result.current.jobs[0].status).toBe('IN_PROGRESS'),
    );
  });
});

describe('useJobDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches job detail when id is provided', async () => {
    const mockJobWithLogs = {
      ...mockJob,
      statusLogs: [
        { id: 'sl1', jobId: 'j1', fromStatus: null, toStatus: 'QUEUED', changedBy: 'admin', note: null, createdAt: '2025-01-01T00:00:00Z' },
      ],
    };

    mockApi.get.mockResolvedValue({
      data: { data: mockJobWithLogs },
    });

    const { result } = renderHook(() => useJobDetail('j1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.get).toHaveBeenCalledWith('/jobs/j1');
    expect(result.current.job?.jobType).toBe('INSTALL');
    expect(result.current.job?.statusLogs).toHaveLength(1);
  });

  it('does not fetch when id is null', async () => {
    const { result } = renderHook(() => useJobDetail(null));

    expect(mockApi.get).not.toHaveBeenCalled();
    expect(result.current.job).toBeNull();
  });

  it('handles error gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed to load job'));

    const { result } = renderHook(() => useJobDetail('j1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.job).toBeNull();
    expect(result.current.error).toBe('Failed to load job');
  });
});

describe('useStatusUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates job status successfully', async () => {
    mockApi.patch.mockResolvedValue({
      data: {
        data: {
          job: { ...mockJob, status: 'IN_PROGRESS', version: 2 },
          log: { id: 'sl2', jobId: 'j1', fromStatus: 'QUEUED', toStatus: 'IN_PROGRESS', changedBy: 'admin', note: null, createdAt: '2025-01-01T01:00:00Z' },
        },
      },
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useStatusUpdate(onSuccess));

    await act(async () => {
      const success = await result.current.updateStatus('j1', 'IN_PROGRESS', 1);
      expect(success).toBe(true);
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/jobs/j1/status', {
      status: 'IN_PROGRESS',
      version: 1,
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('handles error on status update', async () => {
    mockApi.patch.mockRejectedValue(new Error('Version conflict'));

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useStatusUpdate(onSuccess));

    let success: boolean;
    await act(async () => {
      success = await result.current.updateStatus('j1', 'IN_PROGRESS', 1);
    });

    expect(success!).toBe(false);
    await waitFor(() => expect(result.current.error).toBe('Version conflict'));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('handles non-Error catch on status update', async () => {
    mockApi.patch.mockRejectedValue('string error');

    const { result } = renderHook(() => useStatusUpdate());

    let success: boolean;
    await act(async () => {
      success = await result.current.updateStatus('j1', 'IN_PROGRESS', 1);
    });

    expect(success!).toBe(false);
    await waitFor(() => expect(result.current.error).toBe('Failed to update status'));
  });

  it('resetError clears error', async () => {
    mockApi.patch.mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useStatusUpdate());

    await act(async () => {
      await result.current.updateStatus('j1', 'IN_PROGRESS', 1);
    });

    await waitFor(() => expect(result.current.error).toBe('Error'));

    await act(async () => {
      result.current.resetError();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useTodayQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches today queue on mount', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { queued: 3, inProgress: 2, completed: 5 } },
    });

    const { result } = renderHook(() => useTodayQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.get).toHaveBeenCalledWith('/jobs/today-queue');
    expect(result.current.queue).toEqual({ queued: 3, inProgress: 2, completed: 5 });
  });

  it('handles error gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Failed to load queue'));

    const { result } = renderHook(() => useTodayQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.queue).toBeNull();
    expect(result.current.error).toBe('Failed to load queue');
  });

  it('refetch works correctly', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { queued: 3, inProgress: 2, completed: 5 } },
    });

    const { result } = renderHook(() => useTodayQueue());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockApi.get.mockResolvedValue({
      data: { data: { queued: 1, inProgress: 1, completed: 8 } },
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.queue?.completed).toBe(8));
  });
});
