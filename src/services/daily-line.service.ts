import "server-only";

import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { lockUser, owned } from "@/db/owned";
import {
  dailyLinePicks,
  dailyLines,
  dailySetActivation,
  dailySets,
  hiddenLines,
  profiles,
  type DailyLine,
} from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { chooseLine, parsePasteLines } from "@/lib/daily/pick";
import { messages } from "@/lib/messages";
import { DEFAULT_TIME_ZONE, localDateKey } from "@/lib/time/zone";
import { findOwnSet, findReadableSet, readableSetCondition } from "@/services/daily-set.service";
import type {
  BulkDailyLinesInput,
  BulkDailyLinesResponse,
  CreateDailyLineInput,
  DailyLineResponse,
  TodaysLine,
  UpdateDailyLineInput,
} from "@/validators/daily-set.validator";

const HISTORY_CAP = 2000;
const INSERT_CHUNK = 1000;
export const MAX_LINES_PER_SET = 5000;

function toResponse(row: DailyLine, hidden: boolean): DailyLineResponse {
  return { id: row.id, setId: row.setId, text: row.text, position: row.position, hidden };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function nextPosition(tx: Tx, setId: string): Promise<number> {
  const [row] = await tx
    .select({ max: sql<number>`coalesce(max(${dailyLines.position}), -1)::int` })
    .from(dailyLines)
    .where(eq(dailyLines.setId, setId));
  return row.max + 1;
}

async function countLines(tx: Tx, setId: string): Promise<number> {
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(dailyLines)
    .where(eq(dailyLines.setId, setId));
  return row.count;
}

async function existingTexts(executor: Tx | typeof db, setId: string): Promise<string[]> {
  const rows = await executor
    .select({ text: dailyLines.text })
    .from(dailyLines)
    .where(eq(dailyLines.setId, setId));
  return rows.map((row) => row.text);
}

function inOwnEditableSets(userId: string) {
  return inArray(
    dailyLines.setId,
    db
      .select({ id: dailySets.id })
      .from(dailySets)
      .where(and(eq(dailySets.ownerId, userId), eq(dailySets.builtIn, false))),
  );
}

async function loadReadableLine(
  userId: string,
  lineId: string,
): Promise<{ line: DailyLine; builtIn: boolean }> {
  const [row] = await db
    .select({ line: dailyLines, builtIn: dailySets.builtIn })
    .from(dailyLines)
    .innerJoin(dailySets, eq(dailySets.id, dailyLines.setId))
    .where(and(eq(dailyLines.id, lineId), readableSetCondition(userId)));
  if (!row) throw new AppError(404, messages.notFound);
  return row;
}

async function loadOwnLine(userId: string, lineId: string): Promise<DailyLine> {
  const { line, builtIn } = await loadReadableLine(userId, lineId);
  if (builtIn) throw new AppError(403, messages.builtInSetReadOnly);
  return line;
}

async function isHidden(userId: string, lineId: string): Promise<boolean> {
  const [row] = await db
    .select({ lineId: hiddenLines.lineId })
    .from(hiddenLines)
    .where(owned(hiddenLines, userId, eq(hiddenLines.lineId, lineId)));
  return row !== undefined;
}

async function visibleLineIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: dailyLines.id })
    .from(dailyLines)
    .innerJoin(dailySets, eq(dailySets.id, dailyLines.setId))
    .leftJoin(
      dailySetActivation,
      and(eq(dailySetActivation.setId, dailySets.id), eq(dailySetActivation.userId, userId)),
    )
    .leftJoin(
      hiddenLines,
      and(eq(hiddenLines.lineId, dailyLines.id), eq(hiddenLines.userId, userId)),
    )
    .where(
      and(
        readableSetCondition(userId),
        sql`coalesce(${dailySetActivation.active}, true)`,
        sql`${hiddenLines.lineId} is null`,
      ),
    )
    .orderBy(asc(dailyLines.id));
  return rows.map((row) => row.id);
}

async function todayKeyFor(userId: string): Promise<string> {
  const [profile] = await db
    .select({ timeZone: profiles.timeZone })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return localDateKey(new Date(), profile?.timeZone ?? DEFAULT_TIME_ZONE);
}

async function lineById(id: string): Promise<TodaysLine> {
  const [row] = await db
    .select({ id: dailyLines.id, setId: dailyLines.setId, text: dailyLines.text })
    .from(dailyLines)
    .where(eq(dailyLines.id, id));
  return row ?? null;
}

export const dailyLineService = {
  async listLines(userId: string, setId: string): Promise<DailyLineResponse[]> {
    await findReadableSet(userId, setId);
    const [rows, hidden] = await Promise.all([
      db
        .select()
        .from(dailyLines)
        .where(eq(dailyLines.setId, setId))
        .orderBy(asc(dailyLines.position), asc(dailyLines.id))
        .limit(MAX_LINES_PER_SET),
      db
        .select({ lineId: hiddenLines.lineId })
        .from(hiddenLines)
        .innerJoin(dailyLines, eq(dailyLines.id, hiddenLines.lineId))
        .where(owned(hiddenLines, userId, eq(dailyLines.setId, setId))),
    ]);
    const hiddenIds = new Set(hidden.map((row) => row.lineId));
    return rows.map((row) => toResponse(row, hiddenIds.has(row.id)));
  },

  async addLine(
    userId: string,
    setId: string,
    input: CreateDailyLineInput,
  ): Promise<DailyLineResponse> {
    await findOwnSet(userId, setId);
    const row = await db.transaction(async (tx) => {
      await lockUser(tx, userId);
      if ((await countLines(tx, setId)) >= MAX_LINES_PER_SET) {
        throw new AppError(422, messages.dailySetFull);
      }
      const [created] = await tx
        .insert(dailyLines)
        .values({ setId, text: input.text, position: await nextPosition(tx, setId) })
        .returning();
      return created;
    });
    return toResponse(row, false);
  },

  async updateLine(
    userId: string,
    id: string,
    input: UpdateDailyLineInput,
  ): Promise<DailyLineResponse> {
    await loadOwnLine(userId, id);
    const [row] = await db
      .update(dailyLines)
      .set({ text: input.text })
      .where(and(eq(dailyLines.id, id), inOwnEditableSets(userId)))
      .returning();
    if (!row) throw new AppError(404, messages.notFound);
    return toResponse(row, await isHidden(userId, id));
  },

  async removeLine(userId: string, id: string): Promise<void> {
    await loadOwnLine(userId, id);
    const deleted = await db
      .delete(dailyLines)
      .where(and(eq(dailyLines.id, id), inOwnEditableSets(userId)))
      .returning({ id: dailyLines.id });
    if (deleted.length === 0) throw new AppError(404, messages.notFound);
  },

  async bulkAdd(
    userId: string,
    setId: string,
    input: BulkDailyLinesInput,
  ): Promise<BulkDailyLinesResponse> {
    await findOwnSet(userId, setId);
    let parsed: ReturnType<typeof parsePasteLines>;
    if (input.preview) {
      const existing = await existingTexts(db, setId);
      parsed = parsePasteLines(input.text, existing);
      if (existing.length + parsed.lines.length > MAX_LINES_PER_SET) {
        throw new AppError(422, messages.dailySetFull);
      }
    } else {
      parsed = await db.transaction(async (tx) => {
        await lockUser(tx, userId);
        const existing = await existingTexts(tx, setId);
        const result = parsePasteLines(input.text, existing);
        if (existing.length + result.lines.length > MAX_LINES_PER_SET) {
          throw new AppError(422, messages.dailySetFull);
        }
        if (result.lines.length === 0) return result;
        const start = await nextPosition(tx, setId);
        for (let offset = 0; offset < result.lines.length; offset += INSERT_CHUNK) {
          await tx
            .insert(dailyLines)
            .values(
              result.lines
                .slice(offset, offset + INSERT_CHUNK)
                .map((text, index) => ({ setId, text, position: start + offset + index })),
            );
        }
        return result;
      });
    }
    return {
      added: parsed.lines.length,
      skippedEmpty: parsed.skippedEmpty,
      skippedDuplicate: parsed.skippedDuplicate,
      tooLong: parsed.tooLong,
    };
  },

  async hide(userId: string, id: string): Promise<DailyLineResponse> {
    const { line } = await loadReadableLine(userId, id);
    await db.insert(hiddenLines).values({ userId, lineId: id }).onConflictDoNothing();
    return toResponse(line, true);
  },

  async unhide(userId: string, id: string): Promise<DailyLineResponse> {
    const { line } = await loadReadableLine(userId, id);
    await db.delete(hiddenLines).where(owned(hiddenLines, userId, eq(hiddenLines.lineId, id)));
    return toResponse(line, false);
  },

  async getTodaysLine(userId: string, todayKey?: string): Promise<TodaysLine> {
    const date = todayKey ?? (await todayKeyFor(userId));
    const [visible, [existing]] = await Promise.all([
      visibleLineIds(userId),
      db
        .select({ lineId: dailyLinePicks.lineId })
        .from(dailyLinePicks)
        .where(owned(dailyLinePicks, userId, eq(dailyLinePicks.date, date))),
    ]);

    if (existing && visible.includes(existing.lineId)) return lineById(existing.lineId);

    const history = await db
      .select({ lineId: dailyLinePicks.lineId })
      .from(dailyLinePicks)
      .where(owned(dailyLinePicks, userId, ne(dailyLinePicks.date, date)))
      .orderBy(desc(dailyLinePicks.date))
      .limit(HISTORY_CAP);

    const chosen = chooseLine({
      visibleLineIds: visible,
      pickHistory: history.reverse().map((row) => row.lineId),
      random: Math.random,
    });
    if (!chosen) return null;

    if (existing) {
      await db
        .insert(dailyLinePicks)
        .values({ userId, date, lineId: chosen })
        .onConflictDoUpdate({
          target: [dailyLinePicks.userId, dailyLinePicks.date],
          set: { lineId: chosen },
        });
      return lineById(chosen);
    }

    await db.insert(dailyLinePicks).values({ userId, date, lineId: chosen }).onConflictDoNothing();
    const [stored] = await db
      .select({ lineId: dailyLinePicks.lineId })
      .from(dailyLinePicks)
      .where(owned(dailyLinePicks, userId, eq(dailyLinePicks.date, date)));
    return lineById(stored?.lineId ?? chosen);
  },
};
