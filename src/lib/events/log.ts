import { formatClockRange } from "@/lib/plan/time";
import { formatClock, localDateKey } from "@/lib/time/zone";
import { formatEventDate } from "@/lib/today/format";
import type { SubjectIndex } from "@/lib/today/subject-index";
import type { EventDetailResponse } from "@/validators/event.validator";

export type EventSession = EventDetailResponse["sessions"][number];

export function totalSessionSeconds(sessions: readonly EventSession[]): number {
  return sessions.reduce((total, session) => total + session.seconds, 0);
}

export function spansMultipleRoots(
  sessions: readonly EventSession[],
  index: SubjectIndex,
): boolean {
  const roots = new Set(
    sessions.map((session) => index.get(session.nodeId)?.rootId ?? session.nodeId),
  );
  return roots.size > 1;
}

export function formatSessionWhen(session: EventSession, timeZone: string): string {
  const start = new Date(session.startedAt);
  const end = new Date(session.endedAt);
  const day = formatEventDate(localDateKey(start, timeZone));
  return `${formatClockRange(formatClock(start, timeZone), formatClock(end, timeZone))} · ${day}`;
}
