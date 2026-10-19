import "server-only";

import { asc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import { blocks, events, outlineNodes, type Block } from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { orderAfterMove, summarizePlanned } from "@/lib/plan/plan";
import { progressByBlock, studySessionService } from "@/services/study-session.service";
import type {
  BlockResponse,
  CreateBlockInput,
  ListBlocksQuery,
  PlanSummaryQuery,
  PlanSummaryResponse,
  ReorderBlocksInput,
  StartBlockInput,
  UpdateBlockInput,
} from "@/validators/block.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Tx | typeof db;

function toResponse(row: Block, progressSeconds: number): BlockResponse {
  return {
    id: row.id,
    nodeId: row.nodeId,
    date: row.date,
    timeOfDay: row.timeOfDay ? row.timeOfDay.slice(0, 5) : null,
    plannedMinutes: row.plannedMinutes,
    position: row.position,
    eventId: row.eventId,
    progressSeconds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function toResponses(
  executor: Executor,
  userId: string,
  rows: Block[],
): Promise<BlockResponse[]> {
  const progress = await progressByBlock(
    executor,
    userId,
    rows.map((row) => row.id),
  );
  return rows.map((row) => toResponse(row, progress.get(row.id) ?? 0));
}

async function assertNodeOwned(executor: Executor, userId: string, nodeId: string): Promise<void> {
  const [found] = await executor
    .select({ id: outlineNodes.id })
    .from(outlineNodes)
    .where(owned(outlineNodes, userId, eq(outlineNodes.id, nodeId)));
  if (!found) throw new AppError(404, messages.notFound);
}

async function assertEventOwned(
  executor: Executor,
  userId: string,
  eventId: string,
): Promise<void> {
  const [found] = await executor
    .select({ id: events.id })
    .from(events)
    .where(owned(events, userId, eq(events.id, eventId)));
  if (!found) throw new AppError(404, messages.notFound);
}

export async function loadDay(executor: Executor, userId: string, date: string): Promise<Block[]> {
  return executor
    .select()
    .from(blocks)
    .where(owned(blocks, userId, eq(blocks.date, date)))
    .orderBy(asc(blocks.position), asc(blocks.createdAt), asc(blocks.id));
}

async function renumber(
  tx: Tx,
  userId: string,
  rows: readonly Block[],
  orderedIds: readonly string[],
): Promise<void> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const [index, id] of orderedIds.entries()) {
    if (byId.get(id)?.position === index) continue;
    await tx
      .update(blocks)
      .set({ position: index, updatedAt: new Date() })
      .where(owned(blocks, userId, eq(blocks.id, id)));
  }
}

async function loadOne(executor: Executor, userId: string, id: string): Promise<BlockResponse> {
  const [row] = await executor
    .select()
    .from(blocks)
    .where(owned(blocks, userId, eq(blocks.id, id)));
  if (!row) throw new AppError(404, messages.notFound);
  return (await toResponses(executor, userId, [row]))[0];
}

export interface NewBlockRow {
  nodeId: string;
  date: string;
  timeOfDay: string | null;
  plannedMinutes: number | null;
}

export async function createMany(
  tx: Tx,
  userId: string,
  rows: readonly NewBlockRow[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const dates = [...new Set(rows.map((row) => row.date))];
  const counts = await tx
    .select({ date: blocks.date, count: sql<number>`count(*)::int` })
    .from(blocks)
    .where(owned(blocks, userId, inArray(blocks.date, dates)))
    .groupBy(blocks.date);
  const next = new Map(counts.map((entry) => [entry.date, entry.count]));
  const values = rows.map((row) => {
    const position = next.get(row.date) ?? 0;
    next.set(row.date, position + 1);
    return { userId, ...row, position };
  });
  await tx.insert(blocks).values(values);
  return values.length;
}

export const blockService = {
  async list(userId: string, query: ListBlocksQuery): Promise<BlockResponse[]> {
    const from = query.date ?? query.from;
    const to = query.date ?? query.to;
    const rows = await db
      .select()
      .from(blocks)
      .where(
        owned(
          blocks,
          userId,
          from ? gte(blocks.date, from) : undefined,
          to ? lte(blocks.date, to) : undefined,
          query.eventId ? eq(blocks.eventId, query.eventId) : undefined,
        ),
      )
      .orderBy(asc(blocks.date), asc(blocks.position), asc(blocks.createdAt), asc(blocks.id))
      .limit(query.limit);
    return toResponses(db, userId, rows);
  },

  async create(userId: string, input: CreateBlockInput): Promise<BlockResponse> {
    return db.transaction(async (tx) => {
      await assertNodeOwned(tx, userId, input.nodeId);
      if (input.eventId) await assertEventOwned(tx, userId, input.eventId);
      const day = await loadDay(tx, userId, input.date);
      const [created] = await tx
        .insert(blocks)
        .values({
          userId,
          nodeId: input.nodeId,
          eventId: input.eventId ?? null,
          date: input.date,
          timeOfDay: input.timeOfDay ?? null,
          plannedMinutes: input.plannedMinutes ?? null,
          position: day.length,
        })
        .returning();
      if (input.position !== undefined && input.position < day.length) {
        const ids = orderAfterMove(
          day.map((row) => row.id),
          created.id,
          input.position,
        );
        await renumber(tx, userId, [...day, created], ids);
      }
      return loadOne(tx, userId, created.id);
    });
  },

  async update(userId: string, id: string, patch: UpdateBlockInput): Promise<BlockResponse> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(owned(blocks, userId, eq(blocks.id, id)))
        .for("update");
      if (!row) throw new AppError(404, messages.notFound);
      if (patch.nodeId !== undefined) await assertNodeOwned(tx, userId, patch.nodeId);
      if (patch.eventId) await assertEventOwned(tx, userId, patch.eventId);

      const movesDay = patch.date !== undefined && patch.date !== row.date;
      const targetDate = patch.date ?? row.date;
      const targetDay = (await loadDay(tx, userId, targetDate)).filter((other) => other.id !== id);
      const position = movesDay
        ? (patch.position ?? targetDay.length)
        : (patch.position ?? row.position);

      await tx
        .update(blocks)
        .set({
          ...(patch.nodeId !== undefined && { nodeId: patch.nodeId }),
          ...(patch.eventId !== undefined && { eventId: patch.eventId }),
          ...(movesDay && { date: targetDate }),
          ...(patch.timeOfDay !== undefined && { timeOfDay: patch.timeOfDay }),
          ...(patch.plannedMinutes !== undefined && { plannedMinutes: patch.plannedMinutes }),
          position,
          updatedAt: new Date(),
        })
        .where(owned(blocks, userId, eq(blocks.id, id)));

      if (movesDay || patch.position !== undefined) {
        const moved = { ...row, position, date: targetDate };
        const ids = orderAfterMove(
          targetDay.map((other) => other.id),
          id,
          position,
        );
        await renumber(tx, userId, [...targetDay, moved], ids);
        if (movesDay) {
          const oldDay = (await loadDay(tx, userId, row.date)).filter((other) => other.id !== id);
          await renumber(
            tx,
            userId,
            oldDay,
            oldDay.map((other) => other.id),
          );
        }
      }
      return loadOne(tx, userId, id);
    });
  },

  async reorder(userId: string, input: ReorderBlocksInput): Promise<BlockResponse[]> {
    return db.transaction(async (tx) => {
      const day = await loadDay(tx, userId, input.date);
      const current = new Set(day.map((row) => row.id));
      if (
        day.length !== input.orderedIds.length ||
        !input.orderedIds.every((orderedId) => current.has(orderedId))
      ) {
        throw new AppError(422, messages.plannedReorderMismatch);
      }
      await renumber(tx, userId, day, input.orderedIds);
      return toResponses(tx, userId, await loadDay(tx, userId, input.date));
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [deleted] = await tx
        .delete(blocks)
        .where(owned(blocks, userId, eq(blocks.id, id)))
        .returning();
      if (!deleted) throw new AppError(404, messages.notFound);
      const day = await loadDay(tx, userId, deleted.date);
      await renumber(
        tx,
        userId,
        day,
        day.map((row) => row.id),
      );
    });
  },

  async summary(userId: string, query: PlanSummaryQuery): Promise<PlanSummaryResponse> {
    const [planned, rows] = await Promise.all([
      db
        .select({ nodeId: blocks.nodeId, plannedMinutes: blocks.plannedMinutes })
        .from(blocks)
        .where(owned(blocks, userId, gte(blocks.date, query.from), lte(blocks.date, query.to))),
      db
        .select({
          id: outlineNodes.id,
          parentId: outlineNodes.parentId,
          name: outlineNodes.name,
          position: outlineNodes.position,
        })
        .from(outlineNodes)
        .where(owned(outlineNodes, userId)),
    ]);
    return summarizePlanned(rows, planned);
  },

  async start(
    userId: string,
    id: string,
    input: StartBlockInput,
  ): Promise<{ session: SessionResponse; created: boolean }> {
    return studySessionService.start(userId, { blockId: id, startedFrom: input.startedFrom });
  },
};
