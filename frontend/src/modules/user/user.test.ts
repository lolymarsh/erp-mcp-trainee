import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi, GetRoleLabel } from './model';

const mockApi = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../config/api', () => ({
  api: mockApi,
}));

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GetRoleLabel returns correct Thai translation', () => {
    expect(GetRoleLabel('ADMIN')).toBe('ผู้ดูแลระบบ');
    expect(GetRoleLabel('MANAGER')).toBe('ผู้จัดการ');
    expect(GetRoleLabel('STAFF')).toBe('พนักงาน');
    expect(GetRoleLabel('TECHNICIAN')).toBe('ช่าง');
    expect(GetRoleLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('Filter calls /auth/filter with parameters', async () => {
    const mockRes = {
      data: {
        code: 200,
        message: 'success',
        data: [],
        pagination: { page: 1, pageSize: 20, totalData: 0, totalPage: 1, hasNextPage: false, hasPreviousPage: false },
      },
    };
    mockApi.post.mockResolvedValueOnce(mockRes);

    const params = { page: 1, pageSize: 20, sortName: 'displayName', sortBy: 'asc' as const, filters: [] };
    const result = await userApi.Filter(params);

    expect(mockApi.post).toHaveBeenCalledWith('/auth/filter', params);
    expect(result.code).toBe(200);
  });

  it('Create calls /auth with user input', async () => {
    const mockRes = {
      data: {
        code: 201,
        message: 'success',
        data: { id: 'u1', username: 'john', displayName: 'John Doe', role: 'STAFF', isActive: true, version: 1, createdAt: '2026-08-25' },
      },
    };
    mockApi.post.mockResolvedValueOnce(mockRes);

    const input = { username: 'john', password: 'password123', displayName: 'John Doe', role: 'STAFF' as const };
    const result = await userApi.Create(input);

    expect(mockApi.post).toHaveBeenCalledWith('/auth', input);
    expect(result.data.id).toBe('u1');
  });

  it('Update calls PATCH /auth/:id with update input', async () => {
    const mockRes = {
      data: {
        code: 200,
        message: 'success',
        data: { id: 'u1', username: 'john', displayName: 'John Updated', role: 'STAFF', isActive: true, version: 2, createdAt: '2026-08-25' },
      },
    };
    mockApi.patch.mockResolvedValueOnce(mockRes);

    const input = { displayName: 'John Updated', version: 1 };
    const result = await userApi.Update('u1', input);

    expect(mockApi.patch).toHaveBeenCalledWith('/auth/u1', input);
    expect(result.data.version).toBe(2);
  });

  it('SoftDelete calls DELETE /auth/:id with version', async () => {
    const mockRes = {
      data: {
        code: 200,
        message: 'success',
      },
    };
    mockApi.delete.mockResolvedValueOnce(mockRes);

    const result = await userApi.SoftDelete('u1', { version: 1 });

    expect(mockApi.delete).toHaveBeenCalledWith('/auth/u1', { data: { version: 1 } });
    expect(result.code).toBe(200);
  });

  it('Deactivate calls PATCH /auth/:id/deactivate', async () => {
    const mockRes = {
      data: {
        code: 200,
        message: 'success',
        data: { id: 'u1', username: 'john', displayName: 'John', role: 'STAFF', isActive: false, version: 2, createdAt: '2026-08-25' },
      },
    };
    mockApi.patch.mockResolvedValueOnce(mockRes);

    const result = await userApi.Deactivate('u1');

    expect(mockApi.patch).toHaveBeenCalledWith('/auth/u1/deactivate');
    expect(result.data.isActive).toBe(false);
  });
});
