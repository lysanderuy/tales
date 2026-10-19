import "server-only";

import { desc, eq, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import {
  blocks,
  outlineNodes,
  profiles,
  sessionPauses,
  studySessions,
  type Block,
  type SessionPause,
  type StudySession,
} from "@/db/schema";
import { AppError, mapDbError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { descendantIds, pathOf, type OutlineRow } from "@/lib/outline/tree";
import { keepsBlockLink, playMinutes } from "@/lib/plan/plan";
import { addDays, dayRangeUtc, formatClock, localDateKey } from "@/lib/time/zone";
import {
  activeSeconds,
  clampStopTime,
  extendedPlannedMinutes,
  isStale,
  timerState,
  truncatePauses,
} from "@/lib/timer/timer";
import type {
  CurrentSessionResponse,
  ExtendSessionInput,
  ListSessionsQuery,
  ManualSessionInput,
  SessionResponse,
  StartSessionInput,
  StopSessionInput,
  UpdateSessionInput,
} from "@/validators/study-session.validator";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Tx | typeof db;

const DEFAULT_TIME_ZONE = "Asia/Manila";

export interface NodeTotals {
  seconds: number;
  lastStartedAt: Date;
}

function isUniqueOrOverlapViolation(error: unknown): boolean {
  const mapped = mapDbError(error);
  return (
    mapped?.message === messages.conflictDuplicate || mapped?.message === messages.conflictOverlap
  );
}

function toResponse(row: StudySession, pauses: SessionPause[], now: Date): SessionResponse {
  const timer = {
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    pauses: pauses.map((pause) => ({ pausedAt: pause.pausedAt, resumedAt: pause.resumedAt })),
  };
  const state = timerState(timer);
  return {
    id: row.id,
    nodeId: row.nodeId,
    blockId: row.blockId,
    plannedMinutes: row.plannedMinutes,
    methodTag: row.methodTag,
    note: row.note,
    startedFrom: row.startedFrom,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null,
    state,
    activeSeconds: activeSeconds(timer, now),
    pauses: pauses.map((pause) => ({
      pausedAt: pause.pausedAt.toISOString(),
      resumedAt: pause.resumedAt?.toISOString() ?? null,
    })),
    lastHeartbeatAt: row.lastHeartbeatAt.toISOString(),
    pending: row.endedAt !== null && row.nodeId === null,
    stale: state === "running" && isStale(row.lastHeartbeatAt, now),
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadPauses(
  executor: Executor,
  userId: string,
  sessionIds: string[],
): Promise<Map<string, SessionPause[]>> {
  const bySession = new Map<string, SessionPause[]>();
  if (sessionIds.length === 0) return bySession;
  const rows = await executor
    .select()
    .from(sessionPauses)
    .where(owned(sessionPauses, userId, inArray(sessionPauses.sessionId, sessionIds)))
    .orderBy(sessionPauses.pausedAt);
  for (const row of rows) {
    const list = bySession.get(row.sessionId);
    if (list) list.push(row);
    else bySession.set(row.sessionId, [row]);
  }
  return bySession;
}

async function toResponses(
  executor: Executor,
  userId: string,
  rows: StudySession[],
  now: Date,
): Promise<SessionResponse[]> {
  const pauses = await loadPauses(
    executor,
    userId,
    rows.map((row) => row.id),
  );
  return rows.map((row) => toResponse(row, pauses.get(row.id) ?? [], now));
}

async function loadResponse(
  executor: Executor,
  userId: string,
  id: string,
  now: Date,
): Promise<SessionResponse> {
  const [row] = await executor
    .select()
    .from(studySessions)
    .where(owned(studySessions, userId, eq(studySessions.id, id)));
  if (!row) throw new AppError(404, messages.notFound);
  return (await toResponses(executor, userId, [row], now))[0];
}

// Row lock serialises concurrent pause/resume/stop/edit on one record.
async function lockRecord(tx: Tx, userId: string, id: string): Promise<StudySession> {
  const [row] = await tx
    .select()
    .from(studySessions)
    .where(owned(studySessions, userId, eq(studySessions.id, id)))
    .for("update");
  if (!row) throw new AppError(404, messages.notFound);
  return row;
}

async function assertNodeOwned(executor: Executor, userId: string, nodeId: string): Promise<void> {
  const [found] = await executor
    .select({ id: outlineNodes.id })
    .from(outlineNodes)
    .where(owned(outlineNodes, userId, eq(outlineNodes.id, nodeId)));
  if (!found) throw new AppError(404, messages.notFound);
}

async function loadBlock(executor: Executor, userId: string, id: string): Promise<Block> {
  const [row] = await executor
    .select()
    .from(blocks)
    .where(owned(blocks, userId, eq(blocks.id, id)));
  if (!row) throw new AppError(404, messages.notFound);
  return row;
}

async function keepsLink(
  executor: Executor,
  userId: string,
  block: Block,
  pickedNodeId: string,
): Promise<boolean> {
  return keepsBlockLink(await loadOutlineRows(executor, userId), block.nodeId, pickedNodeId);
}

export async function progressByBlock(
  executor: Executor,
  userId: string,
  blockIds: string[],
): Promise<Map<string, number>> {
  const progress = new Map<string, number>();
  if (blockIds.length === 0) return progress;
  const ids = sql.join(
    blockIds.map((id) => sql`${id}`),
    sql`, `,
  );
  const rows = await executor.execute<{ block_id: string; seconds: string }>(sql`
    select
      s.block_id,
      sum(greatest(extract(epoch from (s.ended_at - s.started_at)) - coalesce(p.paused_seconds, 0), 0)) as seconds
    from study_sessions s
    left join lateral (
      select sum(extract(epoch from (coalesce(sp.resumed_at, s.ended_at) - sp.paused_at))) as paused_seconds
      from session_pauses sp
      where sp.session_id = s.id and sp.user_id = s.user_id
    ) p on true
    where s.user_id = ${userId}
      and s.ended_at is not null
      and s.block_id in (${ids})
    group by s.block_id
  `);
  for (const row of rows) progress.set(row.block_id, Number(row.seconds));
  return progress;
}

async function loadOutlineRows(executor: Executor, userId: string): Promise<OutlineRow[]> {
  return executor
    .select({
      id: outlineNodes.id,
      parentId: outlineNodes.parentId,
      name: outlineNodes.name,
      position: outlineNodes.position,
    })
    .from(outlineNodes)
    .where(owned(outlineNodes, userId));
}

async function userTimeZone(executor: Executor, userId: string): Promise<string> {
  const [profile] = await executor
    .select({ timeZone: profiles.timeZone })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return profile?.timeZone ?? DEFAULT_TIME_ZONE;
}

async function findLive(executor: Executor, userId: string): Promise<StudySession | undefined> {
  const [row] = await executor
    .select()
    .from(studySessions)
    .where(owned(studySessions, userId, isNull(studySessions.endedAt)))
    .limit(1);
  return row;
}

async function assertNoOverlap(
  executor: Executor,
  userId: string,
  range: { start: Date; end: Date },
  excludeId: string | null,
  now: Date,
): Promise<void> {
  const [other] = await executor
    .select()
    .from(studySessions)
    .where(
      owned(
        studySessions,
        userId,
        excludeId === null ? undefined : ne(studySessions.id, excludeId),
        lt(studySessions.startedAt, range.end),
        sql`coalesce(${studySessions.endedAt}, 'infinity'::timestamptz) > ${range.start.toISOString()}::timestamptz`,
      ),
    )
    .orderBy(studySessions.startedAt)
    .limit(1);
  if (!other) return;

  const [timeZone, rows] = await Promise.all([
    userTimeZone(executor, userId),
    loadOutlineRows(executor, userId),
  ]);
  const path = other.nodeId ? pathOf(rows, other.nodeId).join(" > ") : "";
  const name = path || "an unlabelled record";
  throw new AppError(
    409,
    messages.overlapsWith(
      name,
      formatClock(other.startedAt, timeZone),
      formatClock(other.endedAt ?? now, timeZone),
    ),
  );
}

export const studySessionService = {
  async start(
    userId: string,
    input: StartSessionInput,
  ): Promise<{ session: SessionResponse; created: boolean }> {
    const now = new Date();
    try {
      const session = await db.transaction(async (tx) => {
        if (input.nodeId) await assertNodeOwned(tx, userId, input.nodeId);
        let nodeId = input.nodeId ?? null;
        let blockId: string | null = null;
        let plannedMinutes = input.plannedMinutes ?? null;
        if (input.blockId) {
          const block = await loadBlock(tx, userId, input.blockId);
          if (nodeId === null || (await keepsLink(tx, userId, block, nodeId))) {
            nodeId = nodeId ?? block.nodeId;
            blockId = block.id;
            if (input.plannedMinutes === undefined) {
              const progress = (await progressByBlock(tx, userId, [block.id])).get(block.id) ?? 0;
              plannedMinutes = playMinutes(block.plannedMinutes, progress);
            }
          }
        }
        const [created] = await tx
          .insert(studySessions)
          .values({
            userId,
            nodeId,
            blockId,
            plannedMinutes,
            startedFrom: input.startedFrom,
            startedAt: now,
            lastHeartbeatAt: now,
          })
          .returning({ id: studySessions.id });
        return loadResponse(tx, userId, created.id, now);
      });
      return { session, created: true };
    } catch (error) {
      if (!isUniqueOrOverlapViolation(error)) throw error;
      const live = await findLive(db, userId);
      if (!live) throw error;
      return { session: await loadResponse(db, userId, live.id, now), created: false };
    }
  },

  async getCurrent(userId: string): Promise<CurrentSessionResponse> {
    const now = new Date();
    let row = await findLive(db, userId);
    if (!row) {
      [row] = await db
        .select()
        .from(studySessions)
        .where(
          owned(
            studySessions,
            userId,
            isNotNull(studySessions.endedAt),
            isNull(studySessions.nodeId),
          ),
        )
        .orderBy(desc(studySessions.endedAt))
        .limit(1);
    }
    const session = row ? (await toResponses(db, userId, [row], now))[0] : null;
    return { session, serverNow: now.toISOString() };
  },

  async pause(userId: string, id: string): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (row.endedAt) throw new AppError(409, messages.timerNothingRunning);
      const pauses = (await loadPauses(tx, userId, [id])).get(id) ?? [];
      if (pauses.some((pause) => pause.resumedAt === null)) {
        throw new AppError(409, messages.timerAlreadyPaused);
      }
      await tx.insert(sessionPauses).values({
        userId,
        sessionId: id,
        pausedAt: now > row.startedAt ? now : row.startedAt,
      });
      return loadResponse(tx, userId, id, now);
    });
  },

  async resume(userId: string, id: string): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (row.endedAt) throw new AppError(409, messages.timerNothingRunning);
      const pauses = (await loadPauses(tx, userId, [id])).get(id) ?? [];
      const open = pauses.find((pause) => pause.resumedAt === null);
      if (!open) throw new AppError(409, messages.timerNotPaused);
      // resumed_at must be strictly after paused_at (CHECK), even for a same-millisecond resume.
      const resumedAt = now > open.pausedAt ? now : new Date(open.pausedAt.getTime() + 1);
      await tx
        .update(sessionPauses)
        .set({ resumedAt })
        .where(owned(sessionPauses, userId, eq(sessionPauses.id, open.id)));
      return loadResponse(tx, userId, id, now);
    });
  },

  async heartbeat(userId: string, id: string): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (row.endedAt) throw new AppError(409, messages.timerNothingRunning);
      const pauses = (await loadPauses(tx, userId, [id])).get(id) ?? [];
      if (!pauses.some((pause) => pause.resumedAt === null)) {
        await tx
          .update(studySessions)
          .set({ lastHeartbeatAt: now })
          .where(owned(studySessions, userId, eq(studySessions.id, id)));
      }
      return loadResponse(tx, userId, id, now);
    });
  },

  async extend(userId: string, id: string, input: ExtendSessionInput): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (row.endedAt) throw new AppError(409, messages.timerNothingRunning);
      if (row.plannedMinutes === null) throw new AppError(422, messages.extendOnlyCountdown);
      const pauses = (await loadPauses(tx, userId, [id])).get(id) ?? [];
      const active = activeSeconds({ startedAt: row.startedAt, endedAt: null, pauses }, now);
      await tx
        .update(studySessions)
        .set({ plannedMinutes: extendedPlannedMinutes(active, input.minutes), updatedAt: now })
        .where(owned(studySessions, userId, eq(studySessions.id, id)));
      return loadResponse(tx, userId, id, now);
    });
  },

  async stop(userId: string, id: string, input: StopSessionInput): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (row.endedAt) {
        if (input.endedAt) throw new AppError(409, messages.timerNothingRunning);
        return loadResponse(tx, userId, id, now);
      }

      let endedAt = now;
      if (input.endedAt) {
        const clamped = clampStopTime(input.endedAt, row.startedAt, now);
        if (!clamped || clamped.getTime() === row.startedAt.getTime()) {
          throw new AppError(422, messages.stopTimeOutOfRange);
        }
        endedAt = clamped;
      } else if (endedAt.getTime() <= row.startedAt.getTime()) {
        endedAt = new Date(row.startedAt.getTime() + 1);
      }

      const pauses = (await loadPauses(tx, userId, [id])).get(id) ?? [];
      for (const pause of pauses) {
        const [truncated] = truncatePauses([pause], endedAt);
        const where = owned(sessionPauses, userId, eq(sessionPauses.id, pause.id));
        if (!truncated) {
          await tx.delete(sessionPauses).where(where);
        } else if (truncated.resumedAt?.getTime() !== pause.resumedAt?.getTime()) {
          await tx.update(sessionPauses).set({ resumedAt: truncated.resumedAt }).where(where);
        }
      }

      await tx
        .update(studySessions)
        .set({ endedAt, updatedAt: now })
        .where(owned(studySessions, userId, eq(studySessions.id, id)));
      return loadResponse(tx, userId, id, now);
    });
  },

  async update(userId: string, id: string, patch: UpdateSessionInput): Promise<SessionResponse> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const row = await lockRecord(tx, userId, id);
      if (patch.nodeId !== undefined) await assertNodeOwned(tx, userId, patch.nodeId);

      let nextNodeId = patch.nodeId;
      let nextBlockId: string | null | undefined;
      if (patch.blockId) {
        const block = await loadBlock(tx, userId, patch.blockId);
        nextNodeId = block.nodeId;
        nextBlockId = block.id;
      } else if (patch.blockId === null) {
        nextBlockId = null;
      } else if (patch.nodeId !== undefined && row.blockId) {
        const [current] = await tx
          .select()
          .from(blocks)
          .where(owned(blocks, userId, eq(blocks.id, row.blockId)));
        if (!current || !(await keepsLink(tx, userId, current, patch.nodeId))) nextBlockId = null;
      }

      const editsTimes = patch.startedAt !== undefined || patch.endedAt !== undefined;
      if (editsTimes) {
        if (row.endedAt === null) throw new AppError(422, messages.timesEditStopped);
        const start = patch.startedAt ?? row.startedAt;
        const end = patch.endedAt ?? row.endedAt;
        if (end.getTime() <= start.getTime()) throw new AppError(422, messages.endBeforeStart);
        if (end.getTime() > now.getTime()) throw new AppError(422, messages.timeInFuture);
        await assertNoOverlap(tx, userId, { start, end }, id, now);
        await tx
          .delete(sessionPauses)
          .where(owned(sessionPauses, userId, eq(sessionPauses.sessionId, id)));
      }

      await tx
        .update(studySessions)
        .set({
          ...(nextNodeId !== undefined && { nodeId: nextNodeId }),
          ...(nextBlockId !== undefined && { blockId: nextBlockId }),
          ...(patch.methodTag !== undefined && { methodTag: patch.methodTag }),
          ...(patch.note !== undefined && { note: patch.note }),
          ...(patch.startedAt !== undefined && { startedAt: patch.startedAt }),
          ...(patch.endedAt !== undefined && { endedAt: patch.endedAt }),
          updatedAt: now,
        })
        .where(owned(studySessions, userId, eq(studySessions.id, id)));
      return loadResponse(tx, userId, id, now);
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    const [deleted] = await db
      .delete(studySessions)
      .where(owned(studySessions, userId, eq(studySessions.id, id)))
      .returning({ id: studySessions.id });
    if (!deleted) throw new AppError(404, messages.notFound);
  },

  async logManual(userId: string, input: ManualSessionInput): Promise<SessionResponse> {
    const now = new Date();
    if (input.endedAt.getTime() > now.getTime()) throw new AppError(422, messages.timeInFuture);
    return db.transaction(async (tx) => {
      await assertNodeOwned(tx, userId, input.nodeId);
      let blockId: string | null = null;
      if (input.blockId) {
        const block = await loadBlock(tx, userId, input.blockId);
        if (await keepsLink(tx, userId, block, input.nodeId)) blockId = block.id;
      }
      await assertNoOverlap(tx, userId, { start: input.startedAt, end: input.endedAt }, null, now);
      const [created] = await tx
        .insert(studySessions)
        .values({
          userId,
          nodeId: input.nodeId,
          blockId,
          startedAt: input.startedAt,
          endedAt: input.endedAt,
          methodTag: input.methodTag ?? null,
          note: input.note ?? null,
          startedFrom: "free",
          lastHeartbeatAt: input.endedAt,
        })
        .returning({ id: studySessions.id });
      return loadResponse(tx, userId, created.id, now);
    });
  },

  async list(userId: string, query: ListSessionsQuery): Promise<SessionResponse[]> {
    const now = new Date();
    let from = query.from;
    let to = query.to;
    if (query.date) {
      const range = dayRangeUtc(query.date, await userTimeZone(db, userId));
      from = range.start;
      to = range.end;
    }

    let nodeIds: string[] | undefined;
    if (query.nodeId) {
      const rows = await loadOutlineRows(db, userId);
      if (!rows.some((row) => row.id === query.nodeId)) throw new AppError(404, messages.notFound);
      nodeIds = [query.nodeId, ...descendantIds(rows, query.nodeId)];
    }

    const rows = await db
      .select()
      .from(studySessions)
      .where(
        owned(
          studySessions,
          userId,
          isNotNull(studySessions.endedAt),
          from && sql`${studySessions.startedAt} >= ${from.toISOString()}::timestamptz`,
          to && lt(studySessions.startedAt, to),
          nodeIds && inArray(studySessions.nodeId, nodeIds),
        ),
      )
      .orderBy(desc(studySessions.startedAt))
      .limit(query.limit);
    return toResponses(db, userId, rows, now);
  },

  async recentWindowStart(userId: string, now: Date, days: number): Promise<Date> {
    const timeZone = await userTimeZone(db, userId);
    return dayRangeUtc(addDays(localDateKey(now, timeZone), -(days - 1)), timeZone).start;
  },

  async totalsByNode(
    userId: string,
    range: { from?: Date; to?: Date } = {},
  ): Promise<Map<string, NodeTotals>> {
    const rows = await db.execute<{
      node_id: string;
      seconds: string;
      last_started_epoch: string;
    }>(sql`
      select
        s.node_id,
        sum(greatest(extract(epoch from (s.ended_at - s.started_at)) - coalesce(p.paused_seconds, 0), 0)) as seconds,
        extract(epoch from max(s.started_at)) as last_started_epoch
      from study_sessions s
      left join lateral (
        select sum(extract(epoch from (coalesce(sp.resumed_at, s.ended_at) - sp.paused_at))) as paused_seconds
        from session_pauses sp
        where sp.session_id = s.id and sp.user_id = s.user_id
      ) p on true
      where s.user_id = ${userId}
        and s.ended_at is not null
        and s.node_id is not null
        ${range.from ? sql`and s.started_at >= ${range.from.toISOString()}::timestamptz` : sql``}
        ${range.to ? sql`and s.started_at < ${range.to.toISOString()}::timestamptz` : sql``}
      group by s.node_id
    `);

    const totals = new Map<string, NodeTotals>();
    for (const row of rows) {
      totals.set(row.node_id, {
        seconds: Number(row.seconds),
        lastStartedAt: new Date(Number(row.last_started_epoch) * 1000),
      });
    }
    return totals;
  },
};
