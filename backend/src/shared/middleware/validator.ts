import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { SendError } from "../response/handler";

export function Validate(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        SendError(res, 400, message);
        return;
      }
      SendError(res, 400, "Validation failed");
    }
  };
}
