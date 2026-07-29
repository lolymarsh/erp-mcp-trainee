import { ForbiddenError } from "../../shared/errors/AppError";

const BLOCKED_KEYWORDS = [
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

function hasBlockedKeyword(sql: string): string | null {
  const upper = sql.toUpperCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(upper)) {
      return keyword;
    }
  }
  return null;
}

export function SanitizeSql(sql: string): string {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();
  const blocked = hasBlockedKeyword(trimmed);
  if (blocked) {
    throw new ForbiddenError(`SQL keyword '${blocked}' is not allowed`);
  }
  if (!upper.startsWith("SELECT") && !upper.startsWith("SHOW") && !upper.startsWith("DESCRIBE") && !upper.startsWith("EXPLAIN")) {
    throw new ForbiddenError("Only SELECT/SHOW/DESCRIBE/EXPLAIN queries are allowed");
  }
  return trimmed;
}
