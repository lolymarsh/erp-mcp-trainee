import type { Db } from "mongodb";
import type { ChatMessageDocument, SessionSummary } from "./entity";

export interface IChatMongoRepository {
  save(message: Omit<ChatMessageDocument, "_id">): Promise<void>;
  getHistory(sessionId: string, limit?: number): Promise<ChatMessageDocument[]>;
  getHistoryAsc(sessionId: string, limit?: number): Promise<ChatMessageDocument[]>;
  listSessions(userId: string, limit?: number): Promise<SessionSummary[]>;
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

  async getHistoryAsc(
    sessionId: string,
    limit = 20,
  ): Promise<ChatMessageDocument[]> {
    const docs = await this.mongoDb
      .collection<ChatMessageDocument>(this.collection)
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    return docs;
  }

  async listSessions(
    userId: string,
    limit = 50,
  ): Promise<SessionSummary[]> {
    const pipeline = [
      { $match: { userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sessionId",
          firstQuestion: { $first: "$question" },
          lastActivity: { $first: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastActivity: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          firstQuestion: 1,
          lastActivity: 1,
          messageCount: 1,
        },
      },
    ];
    const docs = await this.mongoDb
      .collection<ChatMessageDocument>(this.collection)
      .aggregate<SessionSummary>(pipeline)
      .toArray();
    return docs;
  }
}
