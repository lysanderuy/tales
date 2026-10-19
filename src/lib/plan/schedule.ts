import { addDays } from "@/lib/time/zone";

export const MAX_REPEAT_DAYS = 366;

export type ScheduleErrorReason = "no-weekdays" | "end-before-start" | "span-too-long";

export class ScheduleError extends Error {
  constructor(readonly reason: ScheduleErrorReason) {
    super(reason);
    this.name = "ScheduleError";
  }
}

function utcDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

// 1 = Monday ... 7 = Sunday.
export function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

export function repeatDates(input: {
  startKey: string;
  endKey: string;
  weekdays: readonly number[];
}): string[] {
  if (input.weekdays.length === 0) throw new ScheduleError("no-weekdays");
  const span = utcDayNumber(input.endKey) - utcDayNumber(input.startKey) + 1;
  if (span < 1) throw new ScheduleError("end-before-start");
  if (span > MAX_REPEAT_DAYS) throw new ScheduleError("span-too-long");

  const wanted = new Set(input.weekdays);
  const dates: string[] = [];
  for (let offset = 0; offset < span; offset++) {
    const key = addDays(input.startKey, offset);
    if (wanted.has(weekdayOf(key))) dates.push(key);
  }
  return dates;
}
