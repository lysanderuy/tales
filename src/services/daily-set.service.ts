import "server-only";

import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import { dailyLines, dailySetActivation, dailySets, type DailySet } from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import type {
  CreateDailySetInput,
  DailySetActivationInput,
  DailySetResponse,
  RenameDailySetInput,
} from "@/validators/daily-set.validator";

export function readableSetCondition(userId: string) {
  return or(isNull(dailySets.ownerId), eq(dailySets.ownerId, userId));
}

export async function findReadableSet(userId: string, setId: string): Promise<DailySet> {
  const [row] = await db
    .select()
    .from(dailySets)
    .where(and(eq(dailySets.id, setId), readableSetCondition(userId)));
  if (!row) throw new AppError(404, messages.notFound);
  return row;
}

export async function findOwnSet(userId: string, setId: string): Promise<DailySet> {
  const row = await findReadableSet(userId, setId);
  if (row.builtIn) throw new AppError(403, messages.builtInSetReadOnly);
  return row;
}

async function summaries(userId: string, rows: readonly DailySet[]): Promise<DailySetResponse[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const [activation, counts] = await Promise.all([
    db
      .select({ setId: dailySetActivation.setId, active: dailySetActivation.active })
      .from(dailySetActivation)
      .where(owned(dailySetActivation, userId, inArray(dailySetActivation.setId, ids))),
    db
      .select({ setId: dailyLines.setId, total: sql<number>`count(*)::int` })
      .from(dailyLines)
      .where(inArray(dailyLines.setId, ids))
      .groupBy(dailyLines.setId),
  ]);
  const activeBySet = new Map(activation.map((row) => [row.setId, row.active]));
  const countBySet = new Map(counts.map((row) => [row.setId, row.total]));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    builtIn: row.builtIn,
    active: activeBySet.get(row.id) ?? true,
    lineCount: countBySet.get(row.id) ?? 0,
  }));
}

async function summaryOf(userId: string, row: DailySet): Promise<DailySetResponse> {
  const [summary] = await summaries(userId, [row]);
  return summary;
}

export const dailySetService = {
  async list(userId: string): Promise<DailySetResponse[]> {
    const rows = await db
      .select()
      .from(dailySets)
      .where(readableSetCondition(userId))
      .orderBy(desc(dailySets.builtIn), asc(dailySets.createdAt), asc(dailySets.id));
    return summaries(userId, rows);
  },

  async create(userId: string, input: CreateDailySetInput): Promise<DailySetResponse> {
    const [row] = await db
      .insert(dailySets)
      .values({ ownerId: userId, name: input.name, builtIn: false })
      .returning();
    return summaryOf(userId, row);
  },

  async rename(userId: string, id: string, input: RenameDailySetInput): Promise<DailySetResponse> {
    await findOwnSet(userId, id);
    const [row] = await db
      .update(dailySets)
      .set({ name: input.name, updatedAt: new Date() })
      .where(and(eq(dailySets.id, id), eq(dailySets.ownerId, userId)))
      .returning();
    if (!row) throw new AppError(404, messages.notFound);
    return summaryOf(userId, row);
  },

  async remove(userId: string, id: string): Promise<void> {
    await findOwnSet(userId, id);
    await db.delete(dailySets).where(and(eq(dailySets.id, id), eq(dailySets.ownerId, userId)));
  },

  async setActive(
    userId: string,
    id: string,
    input: DailySetActivationInput,
  ): Promise<DailySetResponse> {
    const set = await findReadableSet(userId, id);
    await db
      .insert(dailySetActivation)
      .values({ userId, setId: id, active: input.active })
      .onConflictDoUpdate({
        target: [dailySetActivation.userId, dailySetActivation.setId],
        set: { active: input.active },
      });
    return summaryOf(userId, set);
  },
};
