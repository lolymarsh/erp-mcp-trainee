import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi, SetSessionId, GetDefaultModel } from './model';
import type { SendMessageInput, ExportFormat, Provider, SessionSummary } from './model';

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
  MISSING_API_KEY: 'ไม่ได้ตั้งค่า API Key ใน .env สำหรับ provider นี้',
  OPENAI_KEY_INVALID: 'API key ของ OpenAI ไม่ถูกต้อง',
  GEMINI_KEY_INVALID: 'API key ของ Gemini ไม่ถูกต้อง',
  OPENROUTER_KEY_INVALID: 'API key ของ OpenRouter ไม่ถูกต้อง',
  OPENROUTER_INSUFFICIENT_BALANCE: 'เครดิตไม่เพียงพอ หรือโมเดลนี้ต้องใช้เครดิต',
  OPENAI_RATE_LIMIT: 'AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที',
  GEMINI_RATE_LIMIT: 'AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที',
  OPENROUTER_RATE_LIMIT: 'AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที',
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
  const [provider, setProvider] = useState<Provider>('openrouter');
  const [model, setModel] = useState<string>(() => GetDefaultModel('openrouter'));
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sessionId, setSessionIdState] = useState<string>(() => {
    return localStorage.getItem(SESSION_KEY) || generateSessionId();
  });
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false,
    sql: '',
    resultCount: 0,
    data: [],
  });
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'error',
    persistent: false,
  });
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  const loadSessions = useCallback(async () => {
    try {
      const list = await chatApi.ListSessions(50);
      setSessions(list);
    } catch {
      // silent
    }
  }, []);

  const loadHistory = useCallback(async (sid?: string) => {
    try {
      const history = await chatApi.GetHistory(sid, 50);
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
          timestamp: new Date(msg.createdAt),
        });
      }
      if (loaded.length > 0) {
        setMessages(loaded);
      } else {
        setMessages([]);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    SetSessionId(sessionId);
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) {
      loadHistory();
    }
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProviderChange = useCallback((newProvider: Provider) => {
    setProvider(newProvider);
    setModel(GetDefaultModel(newProvider));
  }, []);

  const switchSession = useCallback(async (sid: string) => {
    setSessionIdState(sid);
    SetSessionId(sid);
    localStorage.setItem(SESSION_KEY, sid);
    await loadHistory(sid);
  }, [loadHistory]);

  const addAssistantMessage = useCallback(
    (
      sql: string,
      resultCount: number,
      data: Record<string, unknown>[],
      msgFormat: string,
      cached = false,
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
      setError(message || code);
      const knownCodes = [
        'MISSING_API_KEY', 'OPENAI_KEY_INVALID', 'GEMINI_KEY_INVALID', 'OPENROUTER_KEY_INVALID',
        'OPENROUTER_INSUFFICIENT_BALANCE',
        'OPENAI_RATE_LIMIT', 'GEMINI_RATE_LIMIT', 'OPENROUTER_RATE_LIMIT',
      ];
      if (knownCodes.includes(code) && errorMessages[code]) {
        const isPersistent = code === 'MISSING_API_KEY' || code.endsWith('_KEY_INVALID') || code === 'OPENROUTER_INSUFFICIENT_BALANCE';
        showToast(errorMessages[code], 'error', isPersistent);
      } else {
        switch (code) {
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
      localStorage.setItem(SESSION_KEY, sessionId);

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
        provider,
        model,
      };

      setStreaming({ active: true, sql: '', resultCount: 0, data: [] });

      controllerRef.current = chatApi.Stream(
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
              const currentStreaming = { sql: '', resultCount: 0, data: [] };
              setStreaming((prev) => {
                currentStreaming.sql = prev.sql;
                currentStreaming.resultCount = prev.resultCount;
                currentStreaming.data = prev.data;
                return prev;
              });
              const isCached = (payload.cached as boolean) ?? false;
              addAssistantMessage(
                currentStreaming.sql,
                currentStreaming.resultCount,
                currentStreaming.data,
                format,
                isCached,
              );
              setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
              setLoading(false);
              loadSessions();
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
          setError(typeof err === 'string' ? err : err.message);
          if (typeof err !== 'string' && err.code === 'NETWORK_ERROR') {
            showToast(errorMessages.NETWORK_ERROR, 'error', false);
          } else {
            showToast(typeof err === 'string' ? err : err.message, 'error', false);
          }
          setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
          setLoading(false);
        },
        () => {
          setLoading(false);
        },
      );
    },
    [format, provider, model, loading, streaming.active, sessionId, showToast, addAssistantMessage, handleErrorEvent, loadSessions],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelStream = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming({ active: false, sql: '', resultCount: 0, data: [] });
    setLoading(false);
  }, []);

  const newSession = useCallback(() => {
    setMessages([]);
    setError(null);
    const newId = generateSessionId();
    setSessionIdState(newId);
    SetSessionId(newId);
    localStorage.setItem(SESSION_KEY, newId);
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
      const blob = await chatApi.ExportResult({
        question: lastAssistant.content.slice(0, 100),
        format: (lastAssistant.format as ExportFormat) ?? 'text',
        provider,
        model,
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
  }, [messages, provider, model]);

  return {
    messages,
    loading,
    error,
    streaming,
    format,
    provider,
    model,
    sessions,
    sessionId,
    toast,
    messagesEndRef,
    setFormat,
    setProvider: handleProviderChange,
    setModel,
    sendMessage,
    clearMessages,
    cancelStream,
    newSession,
    switchSession,
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
    case 'html':
      return buildHtmlTable(data);
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

function buildHtmlTable(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '<p>ไม่พบข้อมูล</p>';
  const cols = Object.keys(data[0]);
  const thead = cols.map(c => `<th>${escapeHtml(c)}</th>`).join('');
  const tbody = data.map(row =>
    `<tr>${cols.map(c => `<td>${escapeHtml(String(row[c] ?? ''))}</td>`).join('')}</tr>`
  ).join('');
  return `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
