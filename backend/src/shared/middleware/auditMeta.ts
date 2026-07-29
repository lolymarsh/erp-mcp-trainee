import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface AuditMeta {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  userDisplayName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      auditMeta?: AuditMeta;
    }
  }
}

export function AuditMetaMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const displayName =
    (req as any).user?.displayName ?? null;
  req.auditMeta = {
    ipAddress: req.ip ?? null,
    userAgent: req.get("User-Agent") ?? null,
    requestId:
      req.get("X-Request-ID") ??
      `REQ_${uuidv4().replace(/-/g, "").slice(0, 20)}`,
    userDisplayName: displayName,
  };
  next();
}
