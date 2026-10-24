import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { daysToBoards } from "@/lib/exam/days-to-boards";
import { rootIdMap } from "@/lib/outline/tree";
import { addDays, DEFAULT_TIME_ZONE, formatClock, localDateKey } from "@/lib/time/zone";
import { assembleToday, pickNextUp, type TodayRecord } from "@/lib/today/today";
import { blockService } from "@/services/block.service";
import { dailyLineService } from "@/services/daily-line.service";
import { eventService } from "@/services/event.service";
import { outlineNodeService } from "@/services/outline-node.service";
import { studySessionService, type DayNodeTotal } from "@/services/study-session.service";
import type { SessionResponse } from "@/validators/study-session.validator";
import type { TodaysLine } from "@/validators/daily-set.validator";
import type { NextUpResponse, TodayResponse } from "@/validators/today.validator";

export interface UserClock {
  timeZone: string;
  examDate: string | null;
  now: Date;
  todayKey: string;
}

export async function loadUserClock(userId: string): Promise<UserClock> {
  const [profile] = await db
    .select({ timeZone: profiles.timeZone, examDate: profiles.examDate })
    .from(profiles)
    .where(eq(profiles.id, userId));
  const timeZone = profile?.timeZone ?? DEFAULT_TIME_ZONE;
  const now = new Date();
  return {
    timeZone,
    examDate: profile?.examDate ?? null,
    now,
    todayKey: localDateKey(now, timeZone),
  };
}

function subjectTotals(
  rows: readonly DayNodeTotal[],
  rootOf: ReadonlyMap<string, string>,
): { rootId: string; seconds: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const rootId = rootOf.get(row.nodeId);
    if (rootId) totals.set(rootId, (totals.get(rootId) ?? 0) + row.seconds);
  }
  return [...totals]
    .map(([rootId, seconds]) => ({ rootId, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}

function toRecord(session: SessionResponse, timeZone: string): TodayRecord {
  const live = session.state !== "stopped";
  return {
    id: session.id,
    blockId: session.blockId,
    nodeId: session.nodeId,
    startedAt: new Date(session.startedAt),
    startClock: formatClock(new Date(session.startedAt), timeZone),
    endClock: session.endedAt ? formatClock(new Date(session.endedAt), timeZone) : null,
    seconds: session.activeSeconds,
    live,
  };
}

async function safeDailyLine(userId: string, todayKey: string): Promise<TodaysLine> {
  try {
    return await dailyLineService.getTodaysLine(userId, todayKey);
  } catch (error) {
    console.error("[today] daily line", error);
    return null;
  }
}

export const todayService = {
  async getToday(userId: string): Promise<TodayResponse> {
    const clock = await loadUserClock(userId);
    const { timeZone, todayKey, now } = clock;
    const firstDay = addDays(todayKey, -6);

    const [nodes, dayRows, todayBlocks, stopped, current, nextEvent, dailyLine] = await Promise.all(
      [
        outlineNodeService.list(userId, { includeArchived: true, includeTotals: false }),
        studySessionService.totalsByDayAndNode(userId, { from: firstDay, to: todayKey }, timeZone),
        blockService.list(userId, { date: todayKey, limit: 500 }),
        studySessionService.list(userId, { date: todayKey, limit: 500 }, timeZone),
        studySessionService.getCurrent(userId),
        eventService.nextUpcoming(userId, { now, timeZone, todayKey }),
        safeDailyLine(userId, todayKey),
      ],
    );

    const rootOf = rootIdMap(nodes);

    const live = current.session;
    const sessions = [...stopped];
    if (live && live.state !== "stopped") sessions.push(live);

    const rows = assembleToday({
      blocks: todayBlocks,
      progressByBlockId: new Map(todayBlocks.map((block) => [block.id, block.progressSeconds])),
      records: sessions.map((session) => toRecord(session, timeZone)),
    });

    const todayRows = dayRows.filter((row) => row.date === todayKey);
    const past7Days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(firstDay, index);
      const forDay = dayRows.filter((row) => row.date === date);
      return {
        date,
        totalSeconds: forDay.reduce((sum, row) => sum + row.seconds, 0),
        bySubject: subjectTotals(forDay, rootOf),
      };
    });

    return {
      todayDate: todayKey,
      daysToBoards: daysToBoards(clock.examDate, todayKey),
      totalSeconds: todayRows.reduce((sum, row) => sum + row.seconds, 0),
      bySubject: subjectTotals(todayRows, rootOf),
      past7Days,
      nextEvent,
      dailyLine,
      rows,
      serverNow: now.toISOString(),
    };
  },

  async nextUp(userId: string, excludeBlockId?: string): Promise<NextUpResponse> {
    const { todayKey } = await loadUserClock(userId);
    const todayBlocks = await blockService.list(userId, { date: todayKey, limit: 500 });
    return pickNextUp(
      todayBlocks,
      new Map(todayBlocks.map((block) => [block.id, block.progressSeconds])),
      excludeBlockId,
    );
  },
};
