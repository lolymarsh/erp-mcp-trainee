import { api } from "../../config/api";

export interface ChatResponse {
  question: string;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
  formatted: string;
  format: string;
  cached: boolean;
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

export interface SendMessageInput {
  question: string;
  format: "text" | "table" | "csv" | "html" | "json";
}

export type ExportFormat = 'text' | 'table' | 'csv' | 'html' | 'json';

export interface StreamError {
  code: string;
  message: string;
}

let sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);

export function getSessionId(): string {
  return sessionId;
}

export function setSessionId(id: string): void {
  sessionId = id;
}

export const chatApi = {
  send: async (input: SendMessageInput): Promise<ChatResponse> => {
    const { data } = await api.post("/chat/send", input, {
      headers: { "X-Session-Id": sessionId },
    });
    return data.data;
  },

  getHistory: async (limit = 50): Promise<ChatMessageDocument[]> => {
    const { data } = await api.get("/chat/history", {
      params: { limit },
      headers: { "X-Session-Id": sessionId },
    });
    return data.data;
  },

  exportResult: async (input: SendMessageInput): Promise<Blob> => {
    const { data } = await api.post("/chat/export", input, {
      responseType: "blob",
      headers: { "X-Session-Id": sessionId },
    });
    return data;
  },

  stream: (
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
