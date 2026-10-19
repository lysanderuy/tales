import { addDays, mondayOf } from "@/lib/time/zone";

export type ReportRange = "last7" | "last30" | "thisWeek" | "custom" | "all";

export interface DayRange {
  fromKey: string;
  toKey: string;
}

export function resolveRange(input: {
  range: ReportRange;
  from?: string;
  to?: string;
  todayKey: string;
  earliestKey: string | null;
}): DayRange {
  const { range, todayKey } = input;
  switch (range) {
    case "last7":
      return { fromKey: addDays(todayKey, -6), toKey: todayKey };
    case "last30":
      return { fromKey: addDays(todayKey, -29), toKey: todayKey };
    case "thisWeek":
      return { fromKey: mondayOf(todayKey), toKey: todayKey };
    case "custom": {
      if (!input.from || !input.to || input.from > input.to) {
        throw new RangeError("A custom range needs from on or before to.");
      }
      return { fromKey: input.from, toKey: input.to };
    }
    case "all": {
      const earliest = input.earliestKey;
      return { fromKey: earliest && earliest < todayKey ? earliest : todayKey, toKey: todayKey };
    }
  }
}

export function daysInRange({ fromKey, toKey }: DayRange): string[] {
  const days: string[] = [];
  for (let day = fromKey; day <= toKey; day = addDays(day, 1)) days.push(day);
  return days;
}
