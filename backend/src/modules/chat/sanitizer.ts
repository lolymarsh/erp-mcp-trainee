import { ForbiddenError } from "../../shared/errors/AppError";

export function sanitizeSql(sql: string): string {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();
  const blocked = [
    "DROP",
    "DELETE",
    "UPDATE",
    "INSERT",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "REVOKE",
    "RENAME",
    "REPLACE",
    "MERGE",
    "CALL",
  ];
  for (const keyword of blocked) {
    if (upper.includes(keyword)) {
      throw new ForbiddenError(`SQL keyword '${keyword}' is not allowed`);
    }
  }
  if (!upper.startsWith("SELECT") && !upper.startsWith("SHOW") && !upper.startsWith("DESCRIBE") && !upper.startsWith("EXPLAIN")) {
    throw new ForbiddenError("Only SELECT/SHOW/DESCRIBE/EXPLAIN queries are allowed");
  }
  return trimmed;
}
