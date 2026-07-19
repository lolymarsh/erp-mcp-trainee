import { describe, it, expect, vi, beforeEach } from 'vitest';

const interceptorFns = vi.hoisted(() => ({
  request: undefined as ((config: Record<string, unknown>) => Record<string, unknown>) | undefined,
  success: undefined as ((response: Record<string, unknown>) => Record<string, unknown>) | undefined,
  error: undefined as ((error: Error & { response?: { status: number } }) => Promise<never>) | undefined,
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      defaults: { baseURL: '/api', headers: { 'Content-Type': 'application/json' } },
      interceptors: {
        request: { use: (fn: (c: Record<string, unknown>) => Record<string, unknown>) => { interceptorFns.request = fn; } },
        response: { use: (fn1: (r: Record<string, unknown>) => Record<string, unknown>, fn2: (e: Error & { response?: { status: number } }) => Promise<never>) => { interceptorFns.success = fn1; interceptorFns.error = fn2; } },
      },
      get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    })),
  },
}));

import { api } from './api';

describe('api config', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates axios instance with baseURL /api', () => {
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists', () => {
      localStorage.setItem('token', 'test-jwt');
      const config = { headers: {} as Record<string, string> };
      const result = interceptorFns.request!(config);
      expect(result).toHaveProperty('headers.Authorization', 'Bearer test-jwt');
    });

    it('omits Authorization when no token', () => {
      const config = { headers: {} as Record<string, string> };
      const result = interceptorFns.request!(config);
      expect(result).not.toHaveProperty('headers.Authorization');
    });
  });

  describe('response interceptor', () => {
    it('success interceptor passes response through', () => {
      const response = { data: 'ok' };
      expect(interceptorFns.success!(response)).toBe(response);
    });

    it('error interceptor clears storage and redirects on 401', async () => {
      localStorage.setItem('token', 't');
      localStorage.setItem('user', '{"u":"a"}');
      Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });
      const err = new Error('401') as Error & { response?: { status: number } };
      err.response = { status: 401 };
      await expect(interceptorFns.error!(err)).rejects.toBe(err);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('error interceptor preserves storage on non-401', async () => {
      localStorage.setItem('token', 'valid');
      const err = new Error('500') as Error & { response?: { status: number } };
      err.response = { status: 500 };
      await expect(interceptorFns.error!(err)).rejects.toBe(err);
      expect(localStorage.getItem('token')).toBe('valid');
    });
  });
});
