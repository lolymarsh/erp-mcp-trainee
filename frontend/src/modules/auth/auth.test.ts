import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

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

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { authApi } from './model';
import { useAuth } from './controller';

const mockLoginResult = {
  data: {
    data: {
      token: 'test-token',
      user: {
        id: '1',
        username: 'admin',
        displayName: 'Admin',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
      },
    },
  },
};

const mockProfileResult = {
  data: {
    data: {
      id: '1',
      username: 'admin',
      displayName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
    },
  },
};

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('login sends POST to /auth/login with correct payload', async () => {
    mockApi.post.mockResolvedValue(mockLoginResult);

    const result = await authApi.login({ username: 'admin', password: 'secret' });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
      username: 'admin',
      password: 'secret',
    });
    expect(result.token).toBe('test-token');
    expect(result.user.username).toBe('admin');
  });

  it('getProfile sends GET to /auth/profile and returns user', async () => {
    mockApi.get.mockResolvedValue(mockProfileResult);

    const result = await authApi.getProfile();

    expect(mockApi.get).toHaveBeenCalledWith('/auth/profile');
    expect(result.username).toBe('admin');
    expect(result.displayName).toBe('Admin');
  });
});

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('stores token and navigates on successful login', async () => {
    mockApi.post.mockResolvedValue(mockLoginResult);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'secret' });
    });

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(result.current.error).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('sets error message on login failure', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'wrong', password: 'wrong' });
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.loading).toBe(false);
  });

  it('sets generic error when response format is unexpected', async () => {
    mockApi.post.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'secret' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles non-object error (isErrorWithMessage line 8)', async () => {
    mockApi.post.mockRejectedValue('string error');

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles null error (isErrorWithMessage line 8)', async () => {
    mockApi.post.mockRejectedValue(null);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error without response property (isErrorWithMessage line 9)', async () => {
    mockApi.post.mockRejectedValue({});

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error with null response (isErrorWithMessage line 11)', async () => {
    mockApi.post.mockRejectedValue({ response: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error without data in response (isErrorWithMessage line 12)', async () => {
    mockApi.post.mockRejectedValue({ response: {} });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error with null response data (isErrorWithMessage line 14)', async () => {
    mockApi.post.mockRejectedValue({ response: { data: null } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error without message in data (isErrorWithMessage line 15)', async () => {
    mockApi.post.mockRejectedValue({ response: { data: {} } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });

  it('handles error with non-string message (isErrorWithMessage line 16)', async () => {
    mockApi.post.mockRejectedValue({ response: { data: { message: 123 } } });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({ username: 'a', password: 'b' });
    });

    expect(result.current.error).toBe('Login failed');
  });
});
