import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi, setSessionId } from './model';
import type { SendMessageInput, ExportFormat } from './model';

const SESSION_KEY = 'chat_session_id';

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
  isError?: boolean;
  errorCode?: string;
  retryQuestion?: string;
}

interface StreamingState {
  active: boolean;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
}

export interface ToastState {
  open: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  persistent: boolean;
}

const errorMessages: Record<string, string> = {
  OPENAI_KEY_INVALID: 'API key ไม่ถูกต้อง กรุณาตรวจสอบ OPENAI_API_KEY ใน .env',
  OPENAI_RATE_LIMIT: 'AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที',
  SQL_TIMEOUT: 'Query ใช้เวลานานเกินไป ลองถามใหม่ด้วยคำที่เจาะจงขึ้น',
  SQL_BLOCKED: 'คำถามนี้ไม่ปลอดภัย กรุณาถามใหม่',
  LLM_ERROR: 'ไม่สามารถสร้าง SQL ได้ กรุณาลองใหม่',
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
};

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [sessionId, setSessionIdState] = useState<string>(() => {
    return localStorage.getItem(SESSION_KEY) || generateSessionId();
  });
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'error',
    persistent: false,
  });
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasSavedSession = useRef(false);

  const showToast = useCallback(
    (message: string, severity: 'error' | 'warning' | 'info' = 'error', persistent = false) => {
      setToast({ open: true, message, severity, persistent });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    try {
      const history = await chatApi.getHistory(50);
      const loaded: ChatMessage[] = [];
      for (const msg of history) {
        loaded.push({
          id: `history-user-${msg._id}`,
          role: 'user',
          content: msg.question,
          timestamp: new Date(msg.createdAt),
        });
        loaded.push({
          id: `history-assistant-${msg._id}`,
          role: 'assistant',
          content: msg.response,
          sql: msg.sql,
          resultCount: msg.resultCount,
          format: msg.format,
          cached: msg.cached,
          timestamp: new Date(msg.createdAt),
        });
      }
      if (loaded.length > 0) {
        setMessages(loaded);
      }
    } catch {
      // silent — history is optional
    }
  }, []);

  useEffect(() => {
    setSessionId(sessionId);
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleErrorEvent = useCallback(
    (code: string, message: string, question: string) => {
      switch (code) {
        case 'OPENAI_KEY_INVALID':
          showToast(errorMessages.OPENAI_KEY_INVALID, 'error', true);
          break;
        case 'OPENAI_RATE_LIMIT':
          showToast(errorMessages.OPENAI_RATE_LIMIT, 'warning', false);
          break;
        case 'SQL_TIMEOUT': {
          const errorBubble: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: errorMessages.SQL_TIMEOUT,
            timestamp: new Date(),
            isError: true,
            errorCode: code,
            retryQuestion: question,
          };
          setMessages((prev) => [...prev, errorBubble]);
          break;
        }
        case 'SQL_BLOCKED': {
          const errorBubble: ChatMessage = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: errorMessages.SQL_BLOCKED,
            timestamp: new Date(),
            isError: true,
            errorCode: code,
          };
          setMessages((prev) => [...prev, errorBubble]);
          break;
        }
        default:
          showToast(message || errorMessages.LLM_ERROR, 'error', false);
          break;
      }
      setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
      setLoading(false);
    },
    [showToast],
  );

  const sendMessage = useCallback(
    async (question: string): Promise<void> => {
      if (!question.trim() || loading || streaming.active) {
        return;
      }

      setError(null);
      setLoading(true);

      if (!hasSavedSession.current) {
        localStorage.setItem(SESSION_KEY, sessionId);
        hasSavedSession.current = true;
      }

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
            case 'error': {
              const code = payload.code as string;
              const message = (payload.message as string) || code;
              handleErrorEvent(code, message, question);
              break;
            }
          }
        },
        (err) => {
          if (err.code === 'NETWORK_ERROR') {
            showToast(errorMessages.NETWORK_ERROR, 'error', false);
          } else {
            showToast(err.message, 'error', false);
          }
          setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    },
    [format, loading, streaming.active, sessionId, showToast, addAssistantMessage, handleErrorEvent],
  );

  const cancelStream = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
    setLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    const newId = generateSessionId();
    setSessionIdState(newId);
    setSessionId(newId);
    hasSavedSession.current = false;
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const retrySend = useCallback(
    async (question: string) => {
      await sendMessage(question);
    },
    [sendMessage],
  );

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
    toast,
    messagesEndRef,
    setFormat,
    sendMessage,
    cancelStream,
    clearMessages,
    exportLastResult,
    retrySend,
    setError,
    hideToast,
  };
}

function formatMessageContent(
  data: Record<string, unknown>[],
  format: string,
): string {
  if (data.length === 0) {
    return 'ไม่พบข้อมูล';
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
