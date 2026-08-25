import { api } from "../../config/api";

export interface ChatResponse {
  question: string;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
  formatted: string;
  format: string;
}

export interface ChatMessageDocument {
  _id: string;
  sessionId: string;
  userId: string;
  question: string;
  sql: string;
  resultCount: number;
  format: string;
  response: string;
  cached: boolean;
  createdAt: string;
}

export interface SessionSummary {
  sessionId: string;
  firstQuestion: string;
  lastActivity: string;
  messageCount: number;
}

export type Provider = "openai" | "gemini" | "openrouter";

export const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "openrouter", label: "OpenRouter" },
];

export const PROVIDER_MODELS: Record<Provider, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  gemini: [
    { value: "gemini-2.0-flash-lite", label: "Flash Lite" },
    { value: "gemini-2.0-flash", label: "Flash" },
    { value: "gemini-2.5-flash", label: "Flash 2.5" },
  ],
  openrouter: [
    { value: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B (free)" },
    { value: "qwen/qwen3-coder:free", label: "Qwen3 Coder (free)" },
    { value: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)" },
    { value: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen3 Next 80B (free)" },
  ],
};

export function GetDefaultModel(provider: Provider): string {
  return PROVIDER_MODELS[provider][0].value;
}

export interface SendMessageInput {
  question: string;
  format: "text" | "table" | "csv" | "html" | "json";
  provider: Provider;
  model?: string;
}

export type ExportFormat = 'text' | 'table' | 'csv' | 'html' | 'json';

export interface StreamError {
  code: string;
  message: string;
}

let sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);

export function GetSessionId(): string {
  return sessionId;
}

export function SetSessionId(id: string): void {
  sessionId = id;
}

export const chatApi = {
  Send: async (input: SendMessageInput): Promise<ChatResponse> => {
    const { data } = await api.post("/chat/send", input, {
      headers: { "X-Session-Id": sessionId },
    });
    return data.data;
  },

  GetHistory: async (sessionIdOrLimit?: string | number, maybeLimit = 50): Promise<ChatMessageDocument[]> => {
    let sid = sessionId;
    let limit = 50;
    if (typeof sessionIdOrLimit === "number") {
      limit = sessionIdOrLimit;
    } else if (typeof sessionIdOrLimit === "string") {
      sid = sessionIdOrLimit;
      if (typeof maybeLimit === "number") {
        limit = maybeLimit;
      }
    }
    const { data } = await api.get("/chat/history", {
      params: { limit },
      headers: { "X-Session-Id": sid },
    });
    return data.data;
  },

  ListSessions: async (limit = 50): Promise<SessionSummary[]> => {
    const { data } = await api.get("/chat/sessions", {
      params: { limit },
    });
    return data.data;
  },

  ExportResult: async (input: SendMessageInput): Promise<Blob> => {
    const { data } = await api.post("/chat/export", input, {
      responseType: "blob",
      headers: { "X-Session-Id": sessionId },
    });
    return data;
  },

  Stream: (
    input: SendMessageInput,
    onEvent: (event: string, payload: Record<string, unknown>) => void,
    onError: (error: StreamError) => void,
    onComplete: () => void,
  ): AbortController => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");

    fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Session-Id": sessionId,
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          onError({ code: "HTTP_ERROR", message: text });
          return;
        }
        const reader = response.body?.getReader();
        if (!reader) {
          onError({ code: "STREAM_ERROR", message: "No response body" });
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }
            const eventMatch = /^event:\s*(.+)$/m.exec(line);
            const dataMatch = /^data:\s*(.+)$/m.exec(line);
            if (eventMatch && dataMatch) {
              try {
                const payload: Record<string, unknown> = JSON.parse(
                  dataMatch[1],
                );
                onEvent(eventMatch[1], payload);
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          onError({ code: "NETWORK_ERROR", message: err.message });
        }
      })
      .finally(() => {
        onComplete();
      });

    return controller;
  },
};
