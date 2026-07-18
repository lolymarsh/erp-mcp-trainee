import { z } from "zod";

export const sendMessageSchema = z.object({
  question: z.string().min(1).max(2000),
  format: z.enum(["text", "table", "csv", "html", "json"]).default("text"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface ChatResponse {
  question: string;
  sql: string;
  resultCount: number;
  data: Record<string, unknown>[];
  formatted: string;
  format: string;
  cached: boolean;
}
