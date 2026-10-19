import { and, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export function owned<T extends PgTable & { userId: AnyColumn }>(
  table: T,
  userId: string,
  ...conds: (SQL | undefined)[]
): SQL | undefined {
  return and(eq(table.userId, userId), ...conds);
}

export async function lockUser(
  tx: { execute: (query: SQL) => PromiseLike<unknown> },
  userId: string,
): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}
