/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConsumeMessage } from "amqplib";
import { startAiWorker } from "./aiWorker";

function createMockMessage(content: string): ConsumeMessage {
  return { content: Buffer.from(content) } as ConsumeMessage;
}

describe("startAiWorker", () => {
  let rmq: any;
  let pool: any;
  let redis: any;
  let consumedHandler: ((msg: ConsumeMessage) => Promise<void>) | null;

  beforeEach(() => {
    consumedHandler = null;
    rmq = {
      channel: {
        consume: jest.fn((_queue: string, handler: (msg: ConsumeMessage) => Promise<void>) => {
          consumedHandler = handler;
        }),
        ack: jest.fn(),
        nack: jest.fn(),
      },
    };
    pool = {
      getConnection: jest.fn(),
    };
    redis = {
      get: jest.fn(),
      setex: jest.fn(),
    };
  });

  it("should return cached data on cache hit", async () => {
    redis.get.mockResolvedValue(JSON.stringify({ rows: 5, data: [] }));

    await startAiWorker(rmq, pool, redis);
    await consumedHandler!(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT 1", format: "json" })));

    expect(redis.setex).toHaveBeenCalledWith(
      expect.stringContaining("ai:job:j1"),
      1800,
      expect.any(String),
    );
    expect(pool.getConnection).not.toHaveBeenCalled();
    expect(rmq.channel.ack).toHaveBeenCalled();
  });

  it("should execute SQL on cache miss", async () => {
    redis.get.mockResolvedValue(null);
    const mockConnection = {
      execute: jest.fn().mockResolvedValue([[{ id: 1, name: "test" }]]),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(mockConnection);

    await startAiWorker(rmq, pool, redis);
    await consumedHandler!(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT * FROM users", format: "json" })));

    expect(mockConnection.execute).toHaveBeenCalledWith("SET SESSION max_execution_time = 60000");
    expect(mockConnection.execute).toHaveBeenCalledWith("SELECT * FROM users");
    expect(mockConnection.release).toHaveBeenCalled();
    expect(redis.setex).toHaveBeenCalledTimes(2);
    expect(rmq.channel.ack).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    redis.get.mockRejectedValue(new Error("redis error"));

    await startAiWorker(rmq, pool, redis);
    await consumedHandler!(createMockMessage(JSON.stringify({ jobId: "j1", sql: "SELECT 1", format: "json" })));

    expect(rmq.channel.nack).toHaveBeenCalled();
  });
});
