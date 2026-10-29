import { formatClockRange } from "@/lib/plan/time";
import { addDays, formatClock, localDateKey } from "@/lib/time/zone";
import { formatEventDate } from "@/lib/today/format";

export function formatLogWhen(
  startedAt: string,
  endedAt: string | null,
  timeZone: string,
  now: Date,
  labels: { today: string; yesterday: string },
): string {
  const start = new Date(startedAt);
  const dayKey = localDateKey(start, timeZone);
  const todayKey = localDateKey(now, timeZone);
  const day =
    dayKey === todayKey
      ? labels.today
      : dayKey === addDays(todayKey, -1)
        ? labels.yesterday
        : formatEventDate(dayKey);
  const end = endedAt ? formatClock(new Date(endedAt), timeZone) : null;
  return `${formatClockRange(formatClock(start, timeZone), end, "")} · ${day}`;
}
