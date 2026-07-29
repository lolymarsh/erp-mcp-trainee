/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConsumeMessage } from "amqplib";
import { consumeFromQueue } from "../config/rabbitmq";
import { StartAuditWorker } from "./auditWorker";

jest.mock("../config/rabbitmq", () => ({
  consumeFromQueue: jest.fn(),
}));

function createMockMessage(content: string): ConsumeMessage {
  return { content: Buffer.from(content) } as ConsumeMessage;
}

const mockedConsumeFromQueue = consumeFromQueue as jest.MockedFunction<typeof consumeFromQueue>;

describe("StartAuditWorker", () => {
  let rmq: any;
  let mongoDb: any;

  beforeEach(() => {
    mockedConsumeFromQueue.mockReset();
    rmq = {};
    mongoDb = { collection: jest.fn() };
  });

  it("should insert audit log on success", async () => {
    let handler!: (msg: ConsumeMessage) => Promise<void>;
    mockedConsumeFromQueue.mockImplementation(async (_rmq: any, _queue: string, h: (msg: ConsumeMessage) => Promise<void>) => {
      handler = h;
    });

    const insertOne = jest.fn().mockResolvedValue({ insertedId: "abc" });
    mongoDb.collection.mockReturnValue({ insertOne });

    await StartAuditWorker(rmq, mongoDb);
    await handler(createMockMessage(JSON.stringify({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: { amount: 5000 },
      timestamp: "2026-07-18T00:00:00.000Z",
    })));

    expect(mongoDb.collection).toHaveBeenCalledWith("activity_logs");
    expect(insertOne).toHaveBeenCalledWith({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: { amount: 5000 },
      createdAt: new Date("2026-07-18T00:00:00.000Z"),
    });
  });

  it("should handle errors gracefully", async () => {
    let handler!: (msg: ConsumeMessage) => Promise<void>;
    mockedConsumeFromQueue.mockImplementation(async (_rmq: any, _queue: string, h: (msg: ConsumeMessage) => Promise<void>) => {
      handler = h;
    });

    const insertOne = jest.fn().mockRejectedValue(new Error("mongo error"));
    mongoDb.collection.mockReturnValue({ insertOne });

    await StartAuditWorker(rmq, mongoDb);
    await expect(handler(createMockMessage(JSON.stringify({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: {},
      timestamp: "2026-07-18T00:00:00.000Z",
    })))).resolves.toBeUndefined();
  });
});
