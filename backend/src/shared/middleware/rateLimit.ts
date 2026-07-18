import { Request, Response, NextFunction } from 'express';
import type Redis from 'ioredis';
import { sendError } from '../response/handler';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export function createRateLimitMiddleware(redis: Redis) {
  return async function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.userId || req.ip || 'anonymous';
      const key = `ratelimit:${userId}:${req.path}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.pexpire(key, WINDOW_MS);
      }

      if (current > MAX_REQUESTS) {
        sendError(res, 429, 'Too many requests, please try again later');
        return;
      }

      next();
    } catch (err) {
      next();
    }
  };
}
