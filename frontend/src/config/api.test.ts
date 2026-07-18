import { describe, it, expect, vi, beforeEach } from 'vitest';

let requestInterceptor: (config: Record<string, unknown>) => Record<string, unknown>;
let responseSuccessInterceptor: (response: Record<string, unknown>) => Record<string, unknown>;
let responseErrorInterceptor: (error: Error & { response?: { status: number } }) => Promise<never>;

const mockAxiosInstance = {
  defaults: { baseURL: '/api', headers: { 'Content-Type': 'application/json' } },
  interceptors: {
    request: {
      use: (fn: (c: Record<string, unknown>) => Record<string, unknown>) => { requestInterceptor = fn; },
    },
    response: {
      use: (
        fn1: (r: Record<string, unknown>) => Record<string, unknown>,
        fn2: (e: Error & { response?: { status: number } }) => Promise<never>,
      ) => { responseSuccessInterceptor = fn1; responseErrorInterceptor = fn2; },
    },
  },
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('api config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('creates axios instance with correct baseURL and headers', async () => {
    const { api } = await import('./api');
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has request and response interceptors', async () => {
    await import('./api');
    expect(requestInterceptor).toBeDefined();
    expect(responseErrorInterceptor).toBeDefined();
    expect(responseSuccessInterceptor).toBeDefined();
  });

  it('request interceptor adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-jwt');
    await import('./api');

    const config = { headers: {} as Record<string, string> };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer test-jwt');
  });

  it('request interceptor does not add Authorization when no token', async () => {
    await import('./api');

    const config = { headers: {} as Record<string, string> };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response success interceptor passes through response', async () => {
    await import('./api');

    const response = { data: 'ok' };
    expect(responseSuccessInterceptor(response)).toBe(response);
  });

  it('response error interceptor clears storage and redirects on 401', async () => {
    localStorage.setItem('token', 'old-token');
    localStorage.setItem('user', '{"username":"admin"}');

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    await import('./api');

    const error = new Error('Unauthorized') as Error & { response?: { status: number } };
    error.response = { status: 401 };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('response error interceptor does not clear on non-401', async () => {
    localStorage.setItem('token', 'valid-token');
    await import('./api');

    const error = new Error('Server error') as Error & { response?: { status: number } };
    error.response = { status: 500 };

    await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('valid-token');
  });
});
