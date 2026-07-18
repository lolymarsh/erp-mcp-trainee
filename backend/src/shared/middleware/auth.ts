import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type Redis from "ioredis";
import { sendError } from "../response/handler";

const JWT_SECRET = process.env.JWT_SECRET || "versus-dev-secret-key";

export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "MANAGER" | "STAFF" | "TECHNICIAN";
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export type AuthMiddlewareFn = (
  ...allowedRoles: ("ADMIN" | "MANAGER" | "STAFF" | "TECHNICIAN")[]
) => (req: Request, res: Response, next: NextFunction) => Promise<void>;

export type ReturnedAuthMiddleware = AuthMiddlewareFn;

export function createAuthMiddleware(redis: Redis): AuthMiddlewareFn {
  return function authMiddleware(
    ...allowedRoles: ("ADMIN" | "MANAGER" | "STAFF" | "TECHNICIAN")[]
  ): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
          sendError(res, 401, "Missing or invalid token");
          return;
        }

        const token = header.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const sessionKey = `session:${decoded.userId}`;
        const exists = await redis.exists(sessionKey);
        if (!exists) {
          sendError(res, 401, "Session expired");
          return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          sendError(res, 403, "Insufficient permissions");
          return;
        }

        req.user = decoded;
        next();
      } catch {
        sendError(res, 401, "Invalid token");
      }
    };
  };
}
