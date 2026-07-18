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

import { jobApi } from './model';

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

const mockStatusLog = {
  id: 'sl1',
  jobId: 'j1',
  fromStatus: null,
  toStatus: 'QUEUED',
  changedBy: 'admin',
  note: null,
  createdAt: '2025-01-01T00:00:00Z',
};

describe('jobApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filter sends POST to /jobs/filter and returns paginated data', async () => {
    const apiResponse = {
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
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await jobApi.filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/jobs/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [],
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].jobType).toBe('INSTALL');
  });

  it('filter with status filter sends correct payload', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: [mockJob],
        pagination: {
          page: 1, pageSize: 20, totalData: 1, totalPage: 1,
          hasNextPage: false, hasPreviousPage: false,
        },
      },
    });

    await jobApi.filter({
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [{ field: 'status', operator: 'eq', value: 'IN_PROGRESS' }],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/jobs/filter', {
      page: 1,
      pageSize: 20,
      sortBy: 'desc',
      filters: [{ field: 'status', operator: 'eq', value: 'IN_PROGRESS' }],
    });
  });

  it('getById sends GET to /jobs/:id with status logs', async () => {
    const apiResponse = {
      data: {
        data: { ...mockJob, statusLogs: [mockStatusLog] },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await jobApi.getById('j1');

    expect(mockApi.get).toHaveBeenCalledWith('/jobs/j1');
    expect(result.statusLogs).toHaveLength(1);
    expect(result.statusLogs[0].toStatus).toBe('QUEUED');
  });

  it('create sends POST to /jobs with input', async () => {
    const apiResponse = {
      data: {
        data: { ...mockJob, statusLogs: [mockStatusLog] },
      },
    };
    mockApi.post.mockResolvedValue(apiResponse);

    const result = await jobApi.create({
      customerId: 'c1',
      vehicleId: 'v1',
      jobType: 'INSTALL',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/jobs', {
      customerId: 'c1',
      vehicleId: 'v1',
      jobType: 'INSTALL',
    });
    expect(result.jobType).toBe('INSTALL');
    expect(result.statusLogs).toHaveLength(1);
  });

  it('create with all optional fields sends full payload', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: { ...mockJob, statusLogs: [mockStatusLog] },
      },
    });

    await jobApi.create({
      customerId: 'c1',
      vehicleId: 'v1',
      jobType: 'REPAIR',
      invoiceId: 'inv1',
      scheduledDate: '2025-01-15',
      technicianId: 'tech1',
      notes: 'Check engine light',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/jobs', {
      customerId: 'c1',
      vehicleId: 'v1',
      jobType: 'REPAIR',
      invoiceId: 'inv1',
      scheduledDate: '2025-01-15',
      technicianId: 'tech1',
      notes: 'Check engine light',
    });
  });

  it('updateStatus sends PATCH to /jobs/:id/status with status and version', async () => {
    const apiResponse = {
      data: {
        data: {
          job: { ...mockJob, status: 'IN_PROGRESS', version: 2 },
          log: {
            id: 'sl2',
            jobId: 'j1',
            fromStatus: 'QUEUED',
            toStatus: 'IN_PROGRESS',
            changedBy: 'admin',
            note: null,
            createdAt: '2025-01-01T01:00:00Z',
          },
        },
      },
    };
    mockApi.patch.mockResolvedValue(apiResponse);

    const result = await jobApi.updateStatus('j1', {
      status: 'IN_PROGRESS',
      version: 1,
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/jobs/j1/status', {
      status: 'IN_PROGRESS',
      version: 1,
    });
    expect(result.job.status).toBe('IN_PROGRESS');
    expect(result.log.toStatus).toBe('IN_PROGRESS');
  });

  it('updateStatus with CANCELLED status and note sends correct payload', async () => {
    mockApi.patch.mockResolvedValue({
      data: {
        data: {
          job: { ...mockJob, status: 'CANCELLED', version: 2 },
          log: {
            id: 'sl3',
            jobId: 'j1',
            fromStatus: 'QUEUED',
            toStatus: 'CANCELLED',
            changedBy: 'admin',
            note: 'Customer cancelled',
            createdAt: '2025-01-01T02:00:00Z',
          },
        },
      },
    });

    await jobApi.updateStatus('j1', {
      status: 'CANCELLED',
      version: 1,
      note: 'Customer cancelled',
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/jobs/j1/status', {
      status: 'CANCELLED',
      version: 1,
      note: 'Customer cancelled',
    });
  });

  it('getTodayQueue sends GET to /jobs/today-queue', async () => {
    const apiResponse = {
      data: {
        data: { queued: 3, inProgress: 2, completed: 5 },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await jobApi.getTodayQueue();

    expect(mockApi.get).toHaveBeenCalledWith('/jobs/today-queue');
    expect(result.queued).toBe(3);
    expect(result.inProgress).toBe(2);
    expect(result.completed).toBe(5);
  });

  it('getTodayQueue returns all zeros when no jobs today', async () => {
    const apiResponse = {
      data: {
        data: { queued: 0, inProgress: 0, completed: 0 },
      },
    };
    mockApi.get.mockResolvedValue(apiResponse);

    const result = await jobApi.getTodayQueue();

    expect(result.queued).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.completed).toBe(0);
  });
});
