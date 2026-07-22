import { z } from "zod";

export const sendMessageSchema = z.object({
  question: z.string().min(1).max(2000),
  format: z.enum(["text", "table", "csv", "html", "json"]).default("text"),
  provider: z.enum(["openai", "gemini", "openrouter"]).default("openrouter"),
  model: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface ChatResponse {
  question: string;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
  formatted: string;
  format: string;
}
