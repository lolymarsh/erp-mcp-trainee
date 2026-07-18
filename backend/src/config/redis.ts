import Redis from "ioredis";
import { logger } from "./logger";

export function createRedis(): Redis {
  const redisUrl =
    process.env.REDIS_URI || "redis://:versus_dev@localhost:6379";
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  client.on("connect", () => {
    logger.info("Redis connected");
  });
  client.on("error", (err: Error) => {
    logger.error({ err }, "Redis error");
  });

  return client;
}
