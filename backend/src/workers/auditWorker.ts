import type { Db } from "mongodb";
import { logger } from "../config/logger";
import { consumeFromQueue } from "../config/rabbitmq";
import type { RabbitMQConnection } from "../config/rabbitmq";

interface AuditMessage {
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export async function StartAuditWorker(
  rmq: RabbitMQConnection,
  mongoDb: Db,
): Promise<void> {
  await consumeFromQueue(rmq, "erp.audit.log", async (msg) => {
    const content = msg.content.toString();
    try {
      const auditMsg: AuditMessage = JSON.parse(content);
      await mongoDb.collection("activity_logs").insertOne({
        entityType: auditMsg.entityType,
        entityId: auditMsg.entityId,
        userId: auditMsg.userId,
        action: auditMsg.action,
        details: auditMsg.details,
        createdAt: new Date(auditMsg.timestamp),
      });
      logger.info({ action: auditMsg.action, entityId: auditMsg.entityId }, "Audit log saved");
    } catch (err: unknown) {
      logger.error({ err, content }, "Failed to process audit log");
    }
  });
}
