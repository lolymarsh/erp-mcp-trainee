import { connect as amqpConnect } from "amqplib";
import type { ChannelModel, Channel, ConsumeMessage, Options } from "amqplib";
import { logger } from "./logger";

const RABBITMQ_URI =
  process.env.RABBITMQ_URI || "amqp://versus:versus_dev@localhost:5672";
const QUEUES = [
  "erp.reports.generate",
  "erp.notifications.send",
  "erp.ai.expensive_query",
  "erp.stock.alerts",
  "erp.audit.log",
];

export interface RabbitMQConnection {
  connection: ChannelModel;
  channel: Channel;
}

export async function createRabbitMQ(): Promise<RabbitMQConnection> {
  const conn = await amqpConnect(RABBITMQ_URI);
  const ch = await conn.createChannel();

  for (const q of QUEUES) {
    await ch.assertQueue(q, { durable: true });
  }

  logger.info("RabbitMQ connected");
  return { connection: conn, channel: ch };
}

export function publishToQueue(
  rmq: RabbitMQConnection,
  queue: string,
  message: object,
): void {
  const payload = JSON.stringify(message);
  const published = rmq.channel.sendToQueue(queue, Buffer.from(payload), {
    persistent: true,
  });
  if (!published) {
    logger.warn({ queue }, "RabbitMQ write buffer full");
  }
}

export async function consumeFromQueue(
  rmq: RabbitMQConnection,
  queue: string,
  handler: (msg: ConsumeMessage) => Promise<void>,
): Promise<void> {
  await rmq.channel.consume(queue, (msg: ConsumeMessage | null) => {
    if (!msg) {
      return;
    }
    handler(msg)
      .then(() => {
        rmq.channel.ack(msg);
      })
      .catch((err: unknown) => {
        logger.error({ err, queue }, "Consumer handler failed");
        rmq.channel.nack(msg, false, true);
      });
  });
  logger.info({ queue }, "RabbitMQ consumer registered");
}

export function buildQueueConfig(durable = true): Options.AssertQueue {
  return { durable };
}
