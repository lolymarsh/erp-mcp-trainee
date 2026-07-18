import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi } from './model';
import type { SendMessageInput, ExportFormat } from './model';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  resultCount?: number;
  data?: Record<string, unknown>[];
  format?: string;
  cached?: boolean;
  timestamp: Date;
}

interface StreamingState {
  active: boolean;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('text');
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false,
    sql: '',
    resultCount: 0,
    data: [],
  });
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string): Promise<void> => {
      if (!question.trim() || loading || streaming.active) {
        return;
      }

      setError(null);
      setLoading(true);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const input: SendMessageInput = {
        question: question.trim(),
        format,
      };

      setStreaming({ active: true, sql: '', resultCount: 0, data: [] });

      controllerRef.current = chatApi.stream(
        input,
        (event, payload) => {
          switch (event) {
            case 'sql_generated':
              setStreaming((prev) => ({
                ...prev,
                sql: payload.sql as string,
              }));
              break;
            case 'result': {
              const rows = payload.rows as number;
              const resultData = (payload.data as Record<string, unknown>[]) ?? [];
              setStreaming((prev) => ({
                ...prev,
                resultCount: rows,
                data: resultData,
              }));
              break;
            }
            case 'done': {
              const cached = (payload.cached as boolean) ?? false;
              const currentStreaming = {
                sql: '',
                resultCount: 0,
                data: [] as Record<string, unknown>[],
              };
              setStreaming((prev) => {
                currentStreaming.sql = prev.sql;
                currentStreaming.resultCount = prev.resultCount;
                currentStreaming.data = prev.data;
                return prev;
              });
              addAssistantMessage(
                currentStreaming.sql,
                currentStreaming.resultCount,
                currentStreaming.data,
                format,
                cached,
              );
              setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
              setLoading(false);
              break;
            }
            case 'error':
              setError(payload.message as string);
              setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
              setLoading(false);
              break;
          }
        },
        (errMsg) => {
          setError(errMsg);
          setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    },
    [format, loading, streaming.active],
  );

  const addAssistantMessage = useCallback(
    (
      sql: string,
      resultCount: number,
      data: Record<string, unknown>[],
      msgFormat: string,
      cached: boolean,
    ) => {
      const content = formatMessageContent(data, msgFormat);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        sql,
        resultCount,
        data,
        format: msgFormat,
        cached,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    [],
  );

  const cancelStream = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
    setLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const exportLastResult = useCallback(async () => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    if (!lastAssistant) {
      return;
    }

    try {
      const blob = await chatApi.exportResult({
        question: lastAssistant.content.slice(0, 100),
        format: (lastAssistant.format as ExportFormat) ?? 'text',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${Date.now()}.${lastAssistant.format === 'csv' ? 'csv' : lastAssistant.format === 'html' ? 'html' : lastAssistant.format === 'json' ? 'json' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [messages]);

  return {
    messages,
    loading,
    error,
    streaming,
    format,
    messagesEndRef,
    setFormat,
    sendMessage,
    cancelStream,
    clearMessages,
    exportLastResult,
    setError,
  };
}

function formatMessageContent(
  data: Record<string, unknown>[],
  format: string,
): string {
  if (data.length === 0) {
    return 'No results found.';
  }

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv': {
      const columns = Object.keys(data[0]);
      const header = columns.join(',');
      const rows = data.map((row) =>
        columns.map((col) => String(row[col] ?? '')).join(','),
      );
      return [header, ...rows].join('\n');
    }
    case 'text':
    case 'table':
    default: {
      const columns = Object.keys(data[0]);
      const header = columns.join(' | ');
      const separator = columns.map(() => '---').join('-|-');
      const rows = data.map((row) =>
        columns.map((col) => String(row[col] ?? '')).join(' | '),
      );
      return [header, separator, ...rows].join('\n');
    }
  }
}
