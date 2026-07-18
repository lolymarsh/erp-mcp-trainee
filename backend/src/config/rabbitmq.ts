import { connect as amqpConnect } from "amqplib";
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

interface RabbitChannel {
  assertQueue(queue: string, opts: { durable: boolean }): Promise<object>;
  close(): Promise<void>;
}

interface RabbitConnection {
  createChannel(): Promise<RabbitChannel>;
  close(): Promise<void>;
}

export interface RabbitMQConnection {
  connection: RabbitConnection;
  channel: RabbitChannel;
}

function isConnection(conn: unknown): conn is RabbitConnection {
  return typeof conn === "object" && conn !== null && "createChannel" in conn;
}

function isChannel(ch: unknown): ch is RabbitChannel {
  return typeof ch === "object" && ch !== null && "assertQueue" in ch;
}

export async function createRabbitMQ(): Promise<RabbitMQConnection> {
  const conn = await amqpConnect(RABBITMQ_URI);
  if (!isConnection(conn)) throw new Error("Invalid RabbitMQ connection");
  const ch = await conn.createChannel();
  if (!isChannel(ch)) throw new Error("Invalid RabbitMQ channel");

  for (const q of QUEUES) {
    await ch.assertQueue(q, { durable: true });
  }

  logger.info("RabbitMQ connected");
  return { connection: conn, channel: ch };
}
