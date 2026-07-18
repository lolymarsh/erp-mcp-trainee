import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import type { Db } from "mongodb";
import { MongoClient } from "mongodb";
import { logger } from "./logger";

export interface DbConnections {
  db: MySql2Database;
  pool: mysql.Pool;
}

export function createDb(): DbConnections {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "versus",
    password: process.env.MYSQL_PASSWORD || "versus_dev",
    database: process.env.MYSQL_DATABASE || "versus_erp",
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_MAX_OPEN_CONNS) || 20,
    maxIdle: Number(process.env.MYSQL_MAX_IDLE_CONNS) || 10,
    idleTimeout: Number(process.env.MYSQL_CONN_MAX_IDLE_TIME) * 1000 || 300000,
    queueLimit: 0,
  });
  const db = drizzle(pool);
  return { db, pool };
}

export interface MongoConnection {
  client: MongoClient;
  mongoDb: Db;
}

export async function createMongo(): Promise<MongoConnection> {
  const uri =
    process.env.MONGO_URI ||
    "mongodb://versus:versus_dev@localhost:27017/versus_erp?authSource=admin";
  const client = new MongoClient(uri);
  await client.connect();
  const mongoDb = client.db("versus_erp");
  logger.info("MongoDB connected");

  await mongoDb
    .collection("chat_messages")
    .createIndex({ sessionId: 1, createdAt: -1 });
  await mongoDb
    .collection("activity_logs")
    .createIndex({ userId: 1, createdAt: -1 });
  await mongoDb
    .collection("activity_logs")
    .createIndex({ entityType: 1, entityId: 1 });
  logger.info("MongoDB indexes created");

  return { client, mongoDb };
}
