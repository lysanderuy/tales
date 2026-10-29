import { addDays, dayRangeUtc, zonedInstant } from "@/lib/time/zone";

export type EventState = "upcoming" | "ready_to_close" | "closed";

export interface EventStateInput {
  date: string;
  time: string | null;
  endTime?: string | null;
  closedAt: Date | null;
}

export function eventState(event: EventStateInput, now: Date, timeZone: string): EventState {
  if (event.closedAt) return "closed";
  return now.getTime() >= readyInstant(event, timeZone).getTime() ? "ready_to_close" : "upcoming";
}

function readyInstant(event: EventStateInput, timeZone: string): Date {
  if (!event.time) return dayRangeUtc(addDays(event.date, 1), timeZone).start;
  const start = event.time.slice(0, 5);
  if (!event.endTime) return zonedInstant(event.date, start, timeZone);
  const end = event.endTime.slice(0, 5);
  return zonedInstant(end <= start ? addDays(event.date, 1) : event.date, end, timeZone);
}

export function markableNodeIds(
  coverIds: readonly string[],
  linkedBlockNodeIds: readonly string[],
): string[] {
  return [...new Set([...coverIds, ...linkedBlockNodeIds])];
}
