/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatMongoRepository } from "./repo_mongo";
import type { Db } from "mongodb";

describe("ChatMongoRepository", () => {
  let mongoDb: any;
  let repo: ChatMongoRepository;
  const collection = "chat_messages";

  beforeEach(() => {
    mongoDb = {
      collection: jest.fn(),
    };
    repo = new ChatMongoRepository(mongoDb as unknown as Db);
  });

  describe("save", () => {
    it("should insert a message into collection", async () => {
      const insertOne = jest.fn().mockResolvedValue({ insertedId: "msg-1" });
      mongoDb.collection.mockReturnValue({ insertOne });

      const message = {
        sessionId: "session-1",
        userId: "user-1",
        question: "test",
        sql: "SELECT 1",
        resultCount: 1,
        format: "text",
        response: "1",
        cached: false,
        createdAt: new Date(),
      };

      await repo.save(message);

      expect(mongoDb.collection).toHaveBeenCalledWith(collection);
      expect(insertOne).toHaveBeenCalledWith(message);
    });
  });

  describe("getHistory", () => {
    it("should return documents sorted by createdAt desc", async () => {
      const docs = [
        { _id: "msg-2", createdAt: new Date("2026-07-19") },
        { _id: "msg-1", createdAt: new Date("2026-07-18") },
      ];
      const toArray = jest.fn().mockResolvedValue(docs);
      const limit = jest.fn().mockReturnValue({ toArray });
      const sort = jest.fn().mockReturnValue({ limit });
      const find = jest.fn().mockReturnValue({ sort });

      mongoDb.collection.mockReturnValue({ find });

      const result = await repo.getHistory("session-1", 10);

      expect(result).toEqual(docs);
      expect(find).toHaveBeenCalledWith({ sessionId: "session-1" });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limit).toHaveBeenCalledWith(10);
    });

    it("should use default limit of 50", async () => {
      const docs: any[] = [];
      const toArray = jest.fn().mockResolvedValue(docs);
      const limit = jest.fn().mockReturnValue({ toArray });
      const sort = jest.fn().mockReturnValue({ limit });
      const find = jest.fn().mockReturnValue({ sort });

      mongoDb.collection.mockReturnValue({ find });

      await repo.getHistory("session-1");

      expect(limit).toHaveBeenCalledWith(50);
    });
  });
});
