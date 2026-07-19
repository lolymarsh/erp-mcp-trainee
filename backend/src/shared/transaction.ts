import type { MySql2Database } from "drizzle-orm/mysql2";

type ExtractTx<T> = T extends {
  transaction: (
    fn: (tx: infer U) => Promise<unknown>,
  ) => Promise<unknown>;
} ? U
  : never;

export type Tx = ExtractTx<MySql2Database>;
