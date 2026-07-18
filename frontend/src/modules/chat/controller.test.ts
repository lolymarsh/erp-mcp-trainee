import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

type StreamCallback = (event: string, payload: Record<string, unknown>) => void;
type ErrorCallback = (error: string) => void;
type CompleteCallback = () => void;

const mockStream = vi.hoisted(() => vi.fn());
const mockExportResult = vi.hoisted(() => vi.fn());

function getStreamEventCb(): StreamCallback {
  return mockStream.mock.calls[0][1];
}

function getStreamErrorCb(): ErrorCallback {
  return mockStream.mock.calls[0][2];
}

function fireEvent(event: string, payload: Record<string, unknown>) {
  getStreamEventCb()(event, payload);
}

function fireError(msg: string) {
  getStreamErrorCb()(msg);
}

vi.mock('./model', () => ({
  chatApi: {
    stream: mockStream,
    exportResult: mockExportResult,
  },
}));

import { useChat } from './controller';

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStream.mockImplementation(
      (
        _input: unknown,
        eventCb: StreamCallback,
        errorCb: ErrorCallback,
        _completeCb: CompleteCallback,
      ) => {
        mockStream._eventCb = eventCb;
        mockStream._errorCb = errorCb;
        return new AbortController();
      },
    );
  });

  it('starts with empty messages and no loading', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.streaming.active).toBe(false);
  });

  it('sendMessage adds user message and starts streaming', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('มียอดขายวันนี้เท่าไหร่');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('มียอดขายวันนี้เท่าไหร่');
    expect(result.current.loading).toBe(true);
    expect(mockStream).toHaveBeenCalledOnce();
  });

  it('does not send empty message', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(mockStream).not.toHaveBeenCalled();
  });

  it('handles sql_generated streaming event', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('sql_generated', { sql: 'SELECT * FROM sales' });
    });

    expect(result.current.streaming.sql).toBe('SELECT * FROM sales');
  });

  it('handles result streaming event', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('result', { rows: 5, data: [{ col1: 'val1' }] });
    });

    expect(result.current.streaming.resultCount).toBe(5);
    expect(result.current.streaming.data).toHaveLength(1);
  });

  it('handles done streaming event and adds assistant message', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('done', { cached: true });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].cached).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming.active).toBe(false);
  });

  it('handles error streaming event', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('error', { message: 'Query failed' });
    });

    expect(result.current.error).toBe('Query failed');
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming.active).toBe(false);
  });

  it('handles stream error callback', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireError('Connection lost');
    });

    expect(result.current.error).toBe('Connection lost');
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming.active).toBe(false);
  });

  it('cancelStream aborts and resets state', async () => {
    const abortController = new AbortController();
    const abortSpy = vi.spyOn(abortController, 'abort');

    mockStream.mockImplementation(() => abortController);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.cancelStream();
    });

    expect(abortSpy).toHaveBeenCalledOnce();
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming.active).toBe(false);
  });

  it('clearMessages resets messages and error', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('done', { cached: true });
    });

    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('setFormat updates format', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.format).toBe('text');

    act(() => {
      result.current.setFormat('csv');
    });

    expect(result.current.format).toBe('csv');
  });

  it('sendMessage does not fire if already loading', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('first');
    });

    mockStream.mockClear();

    await act(async () => {
      await result.current.sendMessage('second');
    });

    expect(mockStream).not.toHaveBeenCalled();
  });

  it('handles done event and adds assistant with no cached flag', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('done', {});
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe('No results found.');
    expect(result.current.messages[1].cached).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming.active).toBe(false);
  });

  it('exportLastResult creates download for assistant message', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' });
    mockExportResult.mockResolvedValue(mockBlob);

    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    act(() => {
      fireEvent('done', {});
    });

    expect(result.current.messages).toHaveLength(2);

    await act(async () => {
      await result.current.exportLastResult();
    });

    expect(mockExportResult).toHaveBeenCalledOnce();
  });

  it('exportLastResult does nothing when no assistant message', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.exportLastResult();
    });

    expect(mockExportResult).not.toHaveBeenCalled();
  });
});
