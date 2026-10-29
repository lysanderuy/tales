import { messages } from "@/lib/messages";
import { dayDiff, formatWeekdayShort } from "@/lib/plan/dates";
import { formatClockRange } from "@/lib/plan/time";

function monthDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function relativeDay(date: string, today: string): string | null {
  const days = dayDiff(today, date);
  if (days < 0) return null;
  if (days === 0) return messages.eventsToday;
  if (days === 1) return messages.eventsTomorrow;
  return messages.eventsInDays(String(days));
}

export function formatShortDate(date: string, today: string): string {
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return sameYear ? monthDay(date) : `${monthDay(date)}, ${date.slice(0, 4)}`;
}

export function formatEventMeta(
  date: string,
  time: string | null,
  today: string,
  endTime: string | null = null,
): string {
  return [formatShortDate(date, today), time ? formatClockRange(time, endTime) : null]
    .filter(Boolean)
    .join(" · ");
}

export function formatEventLine(
  event: { date: string; time: string | null; endTime?: string | null; upcoming: boolean },
  today: string,
): string {
  const parts = [`${formatWeekdayShort(event.date)}, ${formatShortDate(event.date, today)}`];
  if (event.time) parts.push(formatClockRange(event.time, event.endTime ?? null));
  const relative = event.upcoming ? relativeDay(event.date, today) : null;
  if (relative) parts.push(relative);
  return parts.join(" · ");
}
