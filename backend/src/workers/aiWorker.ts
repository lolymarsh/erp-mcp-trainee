import type { Pool } from "mysql2/promise";
import type Redis from "ioredis";
import type { RowDataPacket } from "mysql2/promise";
import crypto from "node:crypto";
import { logger } from "../config/logger";
import { consumeFromQueue } from "../config/rabbitmq";
import { SanitizeSql } from "../modules/chat/sanitizer";
import { FormatResult } from "../modules/chat/formatter";
import type { RabbitMQConnection } from "../config/rabbitmq";

interface HeavyQueryMessage {
  jobId: string;
  sql: string;
  format: string;
}

const CACHE_TTL = 1800;

export async function StartAiWorker(
  rmq: RabbitMQConnection,
  pool: Pool,
  redis: Redis,
): Promise<void> {
  await consumeFromQueue(rmq, "erp.ai.expensive_query", async (msg) => {
    const content = msg.content.toString();
    try {
      const job: HeavyQueryMessage = JSON.parse(content);
      logger.info({ jobId: job.jobId }, "AI worker processing heavy query");

      const cacheKey = `ai:heavy:cache:${crypto.createHash("md5").update(job.sql).digest("hex")}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        await redis.setex(
          `ai:job:${job.jobId}`,
          CACHE_TTL,
          JSON.stringify({ status: "completed", ...JSON.parse(cached) }),
        );
        return;
      }

      SanitizeSql(job.sql);

      const connection = await pool.getConnection();
      let rows: RowDataPacket[];
      try {
        await connection.execute("SET SESSION max_execution_time = 60000");
        const [result] = await connection.execute<RowDataPacket[]>(job.sql);
        rows = result;
      } finally {
        connection.release();
      }

      const data = rows as Record<string, unknown>[];
      const formatted = FormatResult(data, job.format);

      const result = {
        status: "completed",
        sql: job.sql,
        resultCount: data.length,
        data,
        formatted,
        format: job.format,
      };

      await redis.setex(
        `ai:job:${job.jobId}`,
        CACHE_TTL,
        JSON.stringify(result),
      );
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

      logger.info({ jobId: job.jobId, rows: data.length }, "Heavy query completed");
    } catch (err: unknown) {
      logger.error({ err, content }, "AI worker failed to process heavy query");
    }
  });
}
