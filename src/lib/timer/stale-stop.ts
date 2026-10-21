import { formatClock, localDateKey, zonedInstant } from "@/lib/time/zone";
import { formatDayLabel } from "@/lib/today/format";
import { clampStopTime } from "@/lib/timer/timer";

// The time of day is read on the heartbeat's calendar day in timeZone; returns null when it is
// malformed, before the start, or after now.
export function staleStopInstant(
  timeValue: string,
  lastHeartbeatAt: Date,
  startedAt: Date,
  now: Date,
  timeZone: string,
): Date | null {
  let candidate: Date;
  try {
    candidate = zonedInstant(localDateKey(lastHeartbeatAt, timeZone), timeValue, timeZone);
  } catch {
    return null;
  }
  return clampStopTime(candidate, startedAt, now);
}

export function staleDayLabel(instant: Date, now: Date, timeZone: string): string | null {
  const key = localDateKey(instant, timeZone);
  return key === localDateKey(now, timeZone) ? null : formatDayLabel(key);
}

export function staleClockLabel(instant: Date, now: Date, timeZone: string): string {
  const day = staleDayLabel(instant, now, timeZone);
  const time = formatClock(instant, timeZone);
  return day ? `${day} ${time}` : time;
}
