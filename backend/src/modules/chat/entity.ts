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
  createdAt: Date;
}
