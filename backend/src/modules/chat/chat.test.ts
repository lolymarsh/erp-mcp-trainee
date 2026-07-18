/* eslint-disable @typescript-eslint/no-explicit-any */
const mockLLMCreate = jest.fn();

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: mockLLMCreate,
      },
    },
  })),
}));

jest.mock("./repo_mongo", () => ({
  ChatMongoRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue(undefined),
    getHistory: jest.fn(),
  })),
}));

jest.mock("../../config/rabbitmq", () => ({
  publishToQueue: jest.fn(),
}));

jest.mock("../../config/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn() },
}));

jest.mock("./sanitizer", () => ({
  sanitizeSql: jest.fn((sql: string) => sql),
}));

import Redis from "ioredis";
import type { Pool } from "mysql2/promise";
import type { Db } from "mongodb";
import { ChatService } from "./service";
import type { RabbitMQConnection } from "../../config/rabbitmq";

function createMockPool(): any {
  const conn = {
    execute: jest.fn().mockResolvedValue([[]]),
    release: jest.fn(),
  };
  return { getConnection: jest.fn().mockResolvedValue(conn) };
}

const mockDb = { collection: jest.fn() } as unknown as Db;
const mockRmq = {} as RabbitMQConnection;

describe("ChatService", () => {
  let redis: jest.Mocked<Redis>;
  let pool: any;
  let svc: ChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = createMockPool();
    redis = {
      get: jest.fn(),
      setex: jest.fn().mockResolvedValue("OK"),
    } as unknown as jest.Mocked<Redis>;
    svc = new ChatService(pool as Pool, redis, mockDb, mockRmq);
  });

  describe("ask", () => {
    it("should return cached response when cache hit", async () => {
      const cached = {
        question: "ยอดขายวันนี้",
        sql: "SELECT SUM(grand_total) FROM invoices WHERE DATE(created_at) = CURDATE()",
        resultCount: 1,
        data: [{ total: "85000" }],
        formatted: "total: 85000",
        format: "text",
        cached: false,
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await svc.ask(
        { question: "ยอดขายวันนี้", format: "text" },
        "user-1",
        "session-1",
      );

      expect(result.cached).toBe(true);
      expect(result.question).toBe("ยอดขายวันนี้");
      expect(redis.get).toHaveBeenCalledWith(expect.stringContaining("ai:cache:"));
      expect(mockLLMCreate).not.toHaveBeenCalled();
    });

    it("should generate SQL and execute when cache miss", async () => {
      redis.get.mockResolvedValue(null);
      mockLLMCreate.mockResolvedValue({
        choices: [{ message: { content: "SELECT SUM(grand_total) AS total FROM invoices WHERE DATE(created_at) = CURDATE()" } }],
      });
      pool.getConnection.mockResolvedValue({
        execute: jest.fn()
          .mockResolvedValueOnce([undefined])
          .mockResolvedValueOnce([[{ total: "85000" }]]),
        release: jest.fn(),
      });

      const result = await svc.ask(
        { question: "ยอดขายวันนี้", format: "text" },
        "user-1",
        "session-1",
      );

      expect(result.cached).toBe(false);
      expect(result.sql).toContain("SELECT");
      expect(result.data).toHaveLength(1);
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining("ai:cache:"),
        600,
        expect.any(String),
      );
    });

    it("should handle cache miss with empty result", async () => {
      redis.get.mockResolvedValue(null);
      mockLLMCreate.mockResolvedValue({
        choices: [{ message: { content: "SELECT * FROM invoices WHERE 1=0" } }],
      });
      pool.getConnection.mockResolvedValue({
        execute: jest.fn()
          .mockResolvedValueOnce([undefined])
          .mockResolvedValueOnce([[]]),
        release: jest.fn(),
      });

      const result = await svc.ask(
        { question: "ค้นหาที่ไม่มี", format: "text" },
        "user-1",
        "session-1",
      );

      expect(result.resultCount).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("getHistory", () => {
    it("should return chat history from mongo repo", async () => {
      const history = [
        {
          _id: "msg-1",
          sessionId: "session-1",
          userId: "user-1",
          question: "test",
          sql: "SELECT 1",
          resultCount: 1,
          format: "text",
          response: "1",
          cached: false,
          createdAt: new Date(),
        },
      ];
      const { ChatMongoRepository } = await import("./repo_mongo");
      const mockInstance = (ChatMongoRepository as jest.Mock).mock.results[0].value;
      mockInstance.getHistory.mockResolvedValue(history);

      const result = await svc.getHistory("session-1", 10);

      expect(result).toEqual(history);
    });
  });

  describe("executeHeavyQuery", () => {
    it("should execute SQL and return rows", async () => {
      const rows = [{ count: 100 }];
      pool.getConnection.mockResolvedValue({
        execute: jest.fn()
          .mockResolvedValueOnce([undefined])
          .mockResolvedValueOnce([rows]),
        release: jest.fn(),
      });

      const result = await svc.executeHeavyQuery("SELECT COUNT(*) AS count FROM products");

      expect(result).toEqual(rows);
    });

    it("should release connection after execution", async () => {
      const conn = {
        execute: jest.fn()
          .mockResolvedValueOnce([undefined])
          .mockResolvedValueOnce([[]]),
        release: jest.fn(),
      };
      pool.getConnection.mockResolvedValue(conn);

      await svc.executeHeavyQuery("SELECT 1");

      expect(conn.release).toHaveBeenCalled();
    });
  });
});
