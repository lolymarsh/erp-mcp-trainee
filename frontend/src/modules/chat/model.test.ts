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

import { chatApi, GetSessionId } from './model';

describe('chatApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('send posts to /chat/send with session header', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: {
          question: 'test',
          sql: 'SELECT 1',
          resultCount: 1,
          data: [],
          formatted: 'formatted',
          format: 'text',
          cached: false,
        },
      },
    });

    const result = await chatApi.Send({ question: 'test', format: 'text' });

    expect(mockApi.post).toHaveBeenCalledWith('/chat/send', {
      question: 'test',
      format: 'text',
    }, {
      headers: { 'X-Session-Id': GetSessionId() },
    });
    expect(result.sql).toBe('SELECT 1');
    expect(result.resultCount).toBe(1);
  });

  it('getHistory gets /chat/history with session header', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: '1',
            sessionId: 's1',
            userId: 'u1',
            question: 'test',
            sql: 'SELECT 1',
            resultCount: 1,
            format: 'text',
            response: 'result',
            cached: false,
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
      },
    });

    const result = await chatApi.GetHistory(10);

    expect(mockApi.get).toHaveBeenCalledWith('/chat/history', {
      params: { limit: 10 },
      headers: { 'X-Session-Id': GetSessionId() },
    });
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('test');
  });

  it('getHistory uses default limit of 50', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } });

    await chatApi.GetHistory();

    expect(mockApi.get).toHaveBeenCalledWith('/chat/history', {
      params: { limit: 50 },
      headers: { 'X-Session-Id': GetSessionId() },
    });
  });

  it('exportResult posts to /chat/export and returns blob', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    mockApi.post.mockResolvedValue({ data: mockBlob });

    const result = await chatApi.ExportResult({ question: 'test', format: 'csv' });

    expect(mockApi.post).toHaveBeenCalledWith('/chat/export', {
      question: 'test',
      format: 'csv',
    }, {
      responseType: 'blob',
      headers: { 'X-Session-Id': GetSessionId() },
    });
    expect(result).toBe(mockBlob);
  });

  it('GetSessionId returns a string', () => {
    expect(typeof GetSessionId()).toBe('string');
    expect(GetSessionId().length).toBeGreaterThan(0);
  });
});
