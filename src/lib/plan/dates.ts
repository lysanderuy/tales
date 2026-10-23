import { addDays, mondayOf } from "@/lib/time/zone";

const DAYS_IN_WEEK = 7;

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtc(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
}

export function weekDates(dateKey: string): string[] {
  const monday = mondayOf(dateKey);
  return Array.from({ length: DAYS_IN_WEEK }, (_, offset) => addDays(monday, offset));
}

export function dayDiff(fromKey: string, toKey: string): number {
  return Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 864e5);
}

export function shiftDate(dateKey: string, step: number, unit: "day" | "week"): string {
  return addDays(dateKey, unit === "week" ? step * DAYS_IN_WEEK : step);
}

export function dayOfMonth(dateKey: string): number {
  return parseDateKey(dateKey).getUTCDate();
}

export function formatWeekdayShort(dateKey: string): string {
  return formatUtc(parseDateKey(dateKey), { weekday: "short" });
}

export function formatDayTitle(dateKey: string): string {
  return formatUtc(parseDateKey(dateKey), { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekRange(dateKey: string): string {
  const days = weekDates(dateKey);
  const first = parseDateKey(days[0]);
  const last = parseDateKey(days[DAYS_IN_WEEK - 1]);
  const firstMonth = formatUtc(first, { month: "short" });
  const lastMonth = formatUtc(last, { month: "short" });
  const start = `${firstMonth} ${first.getUTCDate()}`;
  return firstMonth === lastMonth
    ? `${start} – ${last.getUTCDate()}`
    : `${start} – ${lastMonth} ${last.getUTCDate()}`;
}

export type MonthCell = { date: string; inMonth: boolean };

export function monthStart(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`;
}

export function shiftMonth(dateKey: string, step: number): string {
  const date = parseDateKey(monthStart(dateKey));
  const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + step, 1));
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${String(shifted.getUTCFullYear()).padStart(4, "0")}-${month}-01`;
}

export function monthEnd(dateKey: string): string {
  return addDays(shiftMonth(dateKey, 1), -1);
}

export function monthGrid(dateKey: string): MonthCell[][] {
  const first = monthStart(dateKey);
  const last = monthEnd(dateKey);
  const weeks: MonthCell[][] = [];
  for (let start = mondayOf(first); start <= last; start = addDays(start, DAYS_IN_WEEK)) {
    weeks.push(
      weekDates(start).map((date) => ({ date, inMonth: date.slice(0, 7) === first.slice(0, 7) })),
    );
  }
  return weeks;
}

export function clampDate(dateKey: string, min?: string, max?: string): string {
  if (min !== undefined && dateKey < min) return min;
  if (max !== undefined && dateKey > max) return max;
  return dateKey;
}

export function formatMonthTitle(dateKey: string): string {
  return formatUtc(parseDateKey(dateKey), { month: "long", year: "numeric" });
}

export function formatDateLong(dateKey: string): string {
  return formatUtc(parseDateKey(dateKey), {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
