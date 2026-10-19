import { addDays, dayRangeUtc, zonedInstant } from "@/lib/time/zone";

export type EventState = "upcoming" | "ready_to_close" | "closed";

export interface EventStateInput {
  date: string;
  time: string | null;
  closedAt: Date | null;
}

export function eventState(event: EventStateInput, now: Date, timeZone: string): EventState {
  if (event.closedAt) return "closed";
  const readyAt = event.time
    ? zonedInstant(event.date, event.time.slice(0, 5), timeZone)
    : dayRangeUtc(addDays(event.date, 1), timeZone).start;
  return now.getTime() >= readyAt.getTime() ? "ready_to_close" : "upcoming";
}

export function markableNodeIds(
  coverIds: readonly string[],
  linkedBlockNodeIds: readonly string[],
): string[] {
  return [...new Set([...coverIds, ...linkedBlockNodeIds])];
}
