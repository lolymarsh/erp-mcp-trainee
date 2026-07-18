import type { Db } from "mongodb";
import type { ChatMessageDocument } from "./entity";

export interface IChatMongoRepository {
  save(message: Omit<ChatMessageDocument, "_id">): Promise<void>;
  getHistory(sessionId: string, limit?: number): Promise<ChatMessageDocument[]>;
}

export class ChatMongoRepository implements IChatMongoRepository {
  private readonly collection = "chat_messages";

  constructor(private mongoDb: Db) {}

  async save(message: Omit<ChatMessageDocument, "_id">): Promise<void> {
    await this.mongoDb.collection(this.collection).insertOne(message);
  }

  async getHistory(
    sessionId: string,
    limit = 50,
  ): Promise<ChatMessageDocument[]> {
    const docs = await this.mongoDb
      .collection<ChatMessageDocument>(this.collection)
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs;
  }
}
