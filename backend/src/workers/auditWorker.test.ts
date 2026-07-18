/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ConsumeMessage } from "amqplib";
import { startAuditWorker } from "./auditWorker";

function createMockMessage(content: string): ConsumeMessage {
  return { content: Buffer.from(content) } as ConsumeMessage;
}

describe("startAuditWorker", () => {
  let rmq: any;
  let mongoDb: any;
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
    mongoDb = {
      collection: jest.fn().mockReturnThis(),
      insertOne: jest.fn(),
    };
  });

  it("should insert audit log on success", async () => {
    mongoDb.collection = jest.fn().mockReturnValue({
      insertOne: jest.fn().mockResolvedValue({ insertedId: "abc" }),
    });

    await startAuditWorker(rmq, mongoDb);
    await consumedHandler!(createMockMessage(JSON.stringify({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: { amount: 5000 },
      timestamp: "2026-07-18T00:00:00.000Z",
    })));

    expect(mongoDb.collection).toHaveBeenCalledWith("activity_logs");
    expect(mongoDb.collection("activity_logs").insertOne).toHaveBeenCalledWith({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: { amount: 5000 },
      createdAt: new Date("2026-07-18T00:00:00.000Z"),
    });
    expect(rmq.channel.ack).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    mongoDb.collection = jest.fn().mockReturnValue({
      insertOne: jest.fn().mockRejectedValue(new Error("mongo error")),
    });

    await startAuditWorker(rmq, mongoDb);
    await consumedHandler!(createMockMessage(JSON.stringify({
      entityType: "invoice",
      entityId: "inv-1",
      userId: "user-1",
      action: "CREATE",
      details: {},
      timestamp: "2026-07-18T00:00:00.000Z",
    })));

    expect(rmq.channel.nack).toHaveBeenCalled();
  });
});
