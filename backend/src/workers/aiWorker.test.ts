/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConsumeMessage } from "amqplib";
import { consumeFromQueue } from "../config/rabbitmq";
import { StartAiWorker } from "./aiWorker";

jest.mock("../config/rabbitmq", () => ({
  consumeFromQueue: jest.fn(),
}));

function createMockMessage(content: string): ConsumeMessage {
  return { content: Buffer.from(content) } as ConsumeMessage;
}

const mockedConsumeFromQueue = consumeFromQueue as jest.MockedFunction<typeof consumeFromQueue>;

describe("StartAiWorker", () => {
  let rmq: any;
  let pool: any;
  let redis: any;

  beforeEach(() => {
    mockedConsumeFromQueue.mockReset();
    rmq = {};
    pool = { getConnection: jest.fn() };
    redis = { get: jest.fn(), setex: jest.fn() };
  });

  it("should return cached data on cache hit", async () => {
    redis.get.mockResolvedValue(JSON.stringify({ rows: 5, data: [] }));
    let handler!: (msg: ConsumeMessage) => Promise<void>;
    mockedConsumeFromQueue.mockImplementation(async (_rmq: any, _queue: string, h: (msg: ConsumeMessage) => Promise<void>) => {
      handler = h;
    });

    await StartAiWorker(rmq, pool, redis);
    await handler(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT 1", format: "json" })));

    expect(redis.setex).toHaveBeenCalledWith(
      expect.stringContaining("ai:job:j1"),
      1800,
      expect.any(String),
    );
    expect(pool.getConnection).not.toHaveBeenCalled();
  });

  it("should execute SQL on cache miss", async () => {
    redis.get.mockResolvedValue(null);
    let handler!: (msg: ConsumeMessage) => Promise<void>;
    mockedConsumeFromQueue.mockImplementation(async (_rmq: any, _queue: string, h: (msg: ConsumeMessage) => Promise<void>) => {
      handler = h;
    });

    const mockConnection = {
      execute: jest.fn().mockResolvedValue([[{ id: 1, name: "test" }]]),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConnection);

    await StartAiWorker(rmq, pool, redis);
    await handler(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT * FROM users", format: "json" })));

    expect(mockConnection.execute).toHaveBeenCalledWith("SET SESSION max_execution_time = 60000");
    expect(mockConnection.execute).toHaveBeenCalledWith("SELECT * FROM users");
    expect(mockConnection.release).toHaveBeenCalled();
    expect(redis.setex).toHaveBeenCalledTimes(2);
  });

  it("should handle errors gracefully", async () => {
    redis.get.mockRejectedValue(new Error("redis error"));
    let handler!: (msg: ConsumeMessage) => Promise<void>;
    mockedConsumeFromQueue.mockImplementation(async (_rmq: any, _queue: string, h: (msg: ConsumeMessage) => Promise<void>) => {
      handler = h;
    });

    await StartAiWorker(rmq, pool, redis);
    await expect(handler(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT 1", format: "json" })))).resolves.toBeUndefined();
  });
});
