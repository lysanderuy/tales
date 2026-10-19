import { and, eq, type AnyColumn, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export function owned<T extends PgTable & { userId: AnyColumn }>(
  table: T,
  userId: string,
  ...conds: (SQL | undefined)[]
): SQL | undefined {
  return and(eq(table.userId, userId), ...conds);
}
