import "server-only";

import { and, asc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import {
  blocks,
  eventCovers,
  eventMarks,
  events,
  outlineNodes,
  profiles,
  type Event,
} from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { eventState, markableNodeIds, type EventState } from "@/lib/events/state";
import { messages } from "@/lib/messages";
import { DEFAULT_TIME_ZONE } from "@/lib/time/zone";
import { progressByBlock } from "@/services/study-session.service";
import type {
  CloseEventInput,
  CreateEventInput,
  EventDetailResponse,
  EventListResponse,
  EventSummaryResponse,
  ListEventsQuery,
  UpdateEventInput,
} from "@/validators/event.validator";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Tx | typeof db;

const MS_PER_DAY = 86_400_000;

export interface NextEvent {
  id: string;
  title: string;
  type: Event["type"];
  date: string;
  time: string | null;
  daysAway: number;
}

async function loadTimeZone(executor: Executor, userId: string): Promise<string> {
  const [profile] = await executor
    .select({ timeZone: profiles.timeZone })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return profile?.timeZone ?? DEFAULT_TIME_ZONE;
}

function clockOf(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function stateOf(row: Event, now: Date, timeZone: string): EventState {
  return eventState({ date: row.date, time: row.time, closedAt: row.closedAt }, now, timeZone);
}

async function loadCovers(
  executor: Executor,
  userId: string,
  eventIds: string[],
): Promise<Map<string, string[]>> {
  const covers = new Map<string, string[]>();
  if (eventIds.length === 0) return covers;
  const rows = await executor
    .select({ eventId: eventCovers.eventId, nodeId: eventCovers.nodeId })
    .from(eventCovers)
    .where(owned(eventCovers, userId, inArray(eventCovers.eventId, eventIds)));
  for (const row of rows) covers.set(row.eventId, [...(covers.get(row.eventId) ?? []), row.nodeId]);
  return covers;
}

function toSummary(
  row: Event,
  coverIds: string[],
  now: Date,
  timeZone: string,
): EventSummaryResponse {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    date: row.date,
    time: clockOf(row.time),
    state: stateOf(row, now, timeZone),
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    coverIds,
  };
}

async function assertNodesOwned(
  executor: Executor,
  userId: string,
  nodeIds: string[],
): Promise<void> {
  if (nodeIds.length === 0) return;
  const found = await executor
    .select({ id: outlineNodes.id })
    .from(outlineNodes)
    .where(owned(outlineNodes, userId, inArray(outlineNodes.id, nodeIds)));
  if (found.length !== new Set(nodeIds).size) throw new AppError(404, messages.notFound);
}

async function replaceCovers(
  tx: Tx,
  userId: string,
  eventId: string,
  nodeIds: string[],
): Promise<void> {
  await tx.delete(eventCovers).where(owned(eventCovers, userId, eq(eventCovers.eventId, eventId)));
  if (nodeIds.length === 0) return;
  await tx.insert(eventCovers).values(nodeIds.map((nodeId) => ({ userId, eventId, nodeId })));
}

async function loadDetail(
  executor: Executor,
  userId: string,
  id: string,
): Promise<EventDetailResponse> {
  const [row] = await executor
    .select()
    .from(events)
    .where(owned(events, userId, eq(events.id, id)));
  if (!row) throw new AppError(404, messages.notFound);

  const [timeZone, covers, marks, linked] = await Promise.all([
    loadTimeZone(executor, userId),
    loadCovers(executor, userId, [id]),
    executor
      .select({ nodeId: eventMarks.nodeId, mark: eventMarks.mark })
      .from(eventMarks)
      .where(owned(eventMarks, userId, eq(eventMarks.eventId, id))),
    executor
      .select()
      .from(blocks)
      .where(owned(blocks, userId, eq(blocks.eventId, id)))
      .orderBy(asc(blocks.date), asc(blocks.position), asc(blocks.createdAt), asc(blocks.id)),
  ]);
  const progress = await progressByBlock(
    executor,
    userId,
    linked.map((block) => block.id),
  );

  const secondsByNode = new Map<string, number>();
  for (const block of linked) {
    secondsByNode.set(
      block.nodeId,
      (secondsByNode.get(block.nodeId) ?? 0) + (progress.get(block.id) ?? 0),
    );
  }

  return {
    ...toSummary(row, covers.get(id) ?? [], new Date(), timeZone),
    note: row.note,
    blocks: linked.map((block) => ({
      id: block.id,
      nodeId: block.nodeId,
      date: block.date,
      plannedMinutes: block.plannedMinutes,
      progressSeconds: progress.get(block.id) ?? 0,
    })),
    sessionSecondsByNode: [...secondsByNode].map(([nodeId, seconds]) => ({ nodeId, seconds })),
    marks,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const GROUP_ORDER: Record<EventState, number> = { ready_to_close: 0, upcoming: 1, closed: 2 };

function compareEvents(a: EventSummaryResponse, b: EventSummaryResponse): number {
  if (a.state !== b.state) return GROUP_ORDER[a.state] - GROUP_ORDER[b.state];
  const byDate = a.date.localeCompare(b.date);
  const byTime = (a.time ?? "").localeCompare(b.time ?? "");
  const ascending = byDate !== 0 ? byDate : byTime;
  return a.state === "closed" ? -ascending : ascending;
}

export const eventService = {
  async list(userId: string, query: ListEventsQuery): Promise<EventListResponse> {
    const [rows, timeZone] = await Promise.all([
      db
        .select()
        .from(events)
        .where(
          owned(
            events,
            userId,
            query.from ? gte(events.date, query.from) : undefined,
            query.to ? lte(events.date, query.to) : undefined,
          ),
        )
        .orderBy(asc(events.date), asc(events.time), asc(events.id)),
      loadTimeZone(db, userId),
    ]);
    const covers = await loadCovers(
      db,
      userId,
      rows.map((row) => row.id),
    );
    const now = new Date();
    const summaries = rows
      .map((row) => toSummary(row, covers.get(row.id) ?? [], now, timeZone))
      .sort(compareEvents);
    return {
      events: summaries,
      hasReadyToClose: summaries.some((event) => event.state === "ready_to_close"),
    };
  },

  async get(userId: string, id: string): Promise<EventDetailResponse> {
    return loadDetail(db, userId, id);
  },

  async create(userId: string, input: CreateEventInput): Promise<EventDetailResponse> {
    return db.transaction(async (tx) => {
      const coverIds = input.coverIds ?? [];
      await assertNodesOwned(tx, userId, coverIds);
      const [created] = await tx
        .insert(events)
        .values({
          userId,
          title: input.title,
          type: input.type,
          date: input.date,
          time: input.time ?? null,
          note: input.note ?? null,
        })
        .returning({ id: events.id });
      await replaceCovers(tx, userId, created.id, coverIds);
      return loadDetail(tx, userId, created.id);
    });
  },

  async update(userId: string, id: string, patch: UpdateEventInput): Promise<EventDetailResponse> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select({ id: events.id })
        .from(events)
        .where(owned(events, userId, eq(events.id, id)))
        .for("update");
      if (!row) throw new AppError(404, messages.notFound);
      if (patch.coverIds !== undefined) await assertNodesOwned(tx, userId, patch.coverIds);

      await tx
        .update(events)
        .set({
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.type !== undefined && { type: patch.type }),
          ...(patch.date !== undefined && { date: patch.date }),
          ...(patch.time !== undefined && { time: patch.time }),
          ...(patch.note !== undefined && { note: patch.note }),
          updatedAt: new Date(),
        })
        .where(owned(events, userId, eq(events.id, id)));
      if (patch.coverIds !== undefined) await replaceCovers(tx, userId, id, patch.coverIds);
      return loadDetail(tx, userId, id);
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await db
      .delete(events)
      .where(owned(events, userId, eq(events.id, id)))
      .returning({ id: events.id });
    if (deleted.length === 0) throw new AppError(404, messages.notFound);
  },

  async close(userId: string, id: string, input: CloseEventInput): Promise<EventDetailResponse> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(events)
        .where(owned(events, userId, eq(events.id, id)))
        .for("update");
      if (!row) throw new AppError(404, messages.notFound);

      const marks = input.marks ?? [];
      if (marks.length > 0) {
        const [covers, linked] = await Promise.all([
          loadCovers(tx, userId, [id]),
          tx
            .selectDistinct({ nodeId: blocks.nodeId })
            .from(blocks)
            .where(owned(blocks, userId, eq(blocks.eventId, id))),
        ]);
        const allowed = new Set(
          markableNodeIds(
            covers.get(id) ?? [],
            linked.map((block) => block.nodeId),
          ),
        );
        if (marks.some((entry) => entry.mark !== null && !allowed.has(entry.nodeId))) {
          throw new AppError(422, messages.eventMarkNotAllowed);
        }

        const toSet = marks.flatMap((entry) =>
          entry.mark === null ? [] : [{ nodeId: entry.nodeId, mark: entry.mark }],
        );
        const toClear = marks.filter((entry) => entry.mark === null).map((entry) => entry.nodeId);
        for (const entry of toSet) {
          await tx
            .insert(eventMarks)
            .values({ userId, eventId: id, nodeId: entry.nodeId, mark: entry.mark })
            .onConflictDoUpdate({
              target: [eventMarks.eventId, eventMarks.nodeId],
              set: { mark: entry.mark },
            });
        }
        if (toClear.length > 0) {
          await tx
            .delete(eventMarks)
            .where(
              owned(
                eventMarks,
                userId,
                eq(eventMarks.eventId, id),
                inArray(eventMarks.nodeId, toClear),
              ),
            );
        }
      }

      await tx
        .update(events)
        .set({
          closedAt: row.closedAt ?? new Date(),
          ...(input.note !== undefined && { note: input.note }),
          updatedAt: new Date(),
        })
        .where(owned(events, userId, eq(events.id, id)));
      return loadDetail(tx, userId, id);
    });
  },

  async nextUpcoming(
    userId: string,
    clock: { now: Date; timeZone: string; todayKey: string },
  ): Promise<NextEvent | null> {
    const rows = await db
      .select()
      .from(events)
      .where(and(owned(events, userId, gte(events.date, clock.todayKey)), isNull(events.closedAt)))
      .orderBy(asc(events.date), sql`${events.time} asc nulls last`, asc(events.id))
      .limit(50);
    const next = rows.find((row) => stateOf(row, clock.now, clock.timeZone) === "upcoming");
    if (!next) return null;
    return {
      id: next.id,
      title: next.title,
      type: next.type,
      date: next.date,
      time: clockOf(next.time),
      daysAway: dayNumber(next.date) - dayNumber(clock.todayKey),
    };
  },
};
