import { formatDayLabel } from "@/lib/today/format";
import { clampStopTime } from "@/lib/timer/timer";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function localTimeValue(instant: Date): string {
  return `${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
}

// The time of day is read on the local calendar day of the last heartbeat; returns null when
// it is malformed, before the start, or after now.
export function staleStopInstant(
  timeValue: string,
  lastHeartbeatAt: Date,
  startedAt: Date,
  now: Date,
): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const candidate = new Date(lastHeartbeatAt);
  candidate.setHours(hours, minutes, 0, 0);
  return clampStopTime(candidate, startedAt, now);
}

function localDateKey(instant: Date): string {
  return `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}`;
}

export function staleDayLabel(instant: Date, now: Date): string | null {
  const key = localDateKey(instant);
  return key === localDateKey(now) ? null : formatDayLabel(key);
}

export function staleClockLabel(instant: Date, now: Date): string {
  const day = staleDayLabel(instant, now);
  const time = localTimeValue(instant);
  return day ? `${day} ${time}` : time;
}
