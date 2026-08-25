import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockApi = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../config/api', () => ({
  api: mockApi,
}));

import {
  useUserList,
  useUserCreate,
  useUserUpdate,
  useUserDelete,
  useUserToggleActive,
} from './controller';

const mockUser = {
  id: 'u1',
  username: 'admin',
  displayName: 'Admin User',
  role: 'ADMIN' as const,
  isActive: true,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

const mockFilterResponse = {
  data: {
    code: 200,
    message: 'success',
    data: [mockUser],
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

describe('useUserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users list on mount', async () => {
    mockApi.post.mockResolvedValueOnce(mockFilterResponse);

    const { result } = renderHook(() => useUserList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].username).toBe('admin');
  });

  it('handles fetch error gracefully', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
  });

  it('sets roleFilter and refetches', async () => {
    mockApi.post.mockResolvedValue(mockFilterResponse);

    const { result } = renderHook(() => useUserList());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setRoleFilter('TECHNICIAN');
    });

    await waitFor(() => {
      expect(result.current.roleFilter).toBe('TECHNICIAN');
    });
  });
});

describe('useUserCreate', () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields before submitting', async () => {
    const { result } = renderHook(() => useUserCreate(onSuccess));

    await act(async () => {
      await result.current.submit({
        username: '',
        password: '',
        displayName: '',
        role: 'STAFF',
      });
    });

    expect(result.current.fieldErrors.username).toBeDefined();
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it('submits successfully when data is valid', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { code: 201, data: mockUser } });
    const { result } = renderHook(() => useUserCreate(onSuccess));

    await act(async () => {
      await result.current.submit({
        username: 'john',
        password: 'password123',
        displayName: 'John Doe',
        role: 'STAFF',
      });
    });

    expect(mockApi.post).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });
});

describe('useUserDelete', () => {
  const onSuccess = vi.fn();

  it('deletes user on submit', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: { code: 200 } });
    const { result } = renderHook(() => useUserDelete(onSuccess));

    act(() => {
      result.current.openWithData(mockUser);
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/auth/u1', { data: { version: 1 } });
    expect(onSuccess).toHaveBeenCalled();
  });
});
