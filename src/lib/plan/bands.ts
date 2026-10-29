import { messages } from "@/lib/messages";
import { formatClock } from "@/lib/time/zone";
import type { SessionResponse } from "@/validators/study-session.validator";

export type Band = "morning" | "afternoon" | "evening" | "unscheduled";

export const BAND_LABELS: Record<Band, string> = {
  morning: messages.planBandMorning,
  afternoon: messages.planBandAfternoon,
  evening: messages.planBandEvening,
  unscheduled: messages.planBandUnscheduled,
};

export const BAND_ORDER: readonly Band[] = ["morning", "afternoon", "evening", "unscheduled"];

const AFTERNOON_START = 12 * 60;
const EVENING_START = 18 * 60;
const OFF_PLAN_MINUTES = 10;

export type BandGroup<T> = { band: Band; items: T[] };

export function clockMinutes(clock: string): number {
  const [hours = "0", minutes = "0"] = clock.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function bandOf(clock: string | null): Band {
  if (clock === null) return "unscheduled";
  const minutes = clockMinutes(clock);
  if (minutes >= EVENING_START) return "evening";
  if (minutes >= AFTERNOON_START) return "afternoon";
  return "morning";
}

export function groupIntoBands<T>(
  items: readonly T[],
  clockOf: (item: T) => string | null,
  positionOf: (item: T) => number,
): BandGroup<T>[] {
  const groups = new Map<Band, T[]>();
  for (const item of items) {
    const band = bandOf(clockOf(item));
    groups.set(band, [...(groups.get(band) ?? []), item]);
  }
  return BAND_ORDER.flatMap((band) => {
    const bandItems = groups.get(band);
    if (!bandItems) return [];
    const sorted = [...bandItems].sort((a, b) => {
      const clockA = clockOf(a);
      const clockB = clockOf(b);
      const byClock =
        clockA !== null && clockB !== null ? clockMinutes(clockA) - clockMinutes(clockB) : 0;
      return byClock || positionOf(a) - positionOf(b);
    });
    return [{ band, items: sorted }];
  });
}

export function startsOffPlan(plannedClock: string, actualClock: string): boolean {
  const gap = Math.abs(clockMinutes(actualClock) - clockMinutes(plannedClock));
  return Math.min(gap, 24 * 60 - gap) >= OFF_PLAN_MINUTES;
}

export function firstStartClock(
  sessions: readonly SessionResponse[] | undefined,
  timeZone: string,
): string | null {
  const first = sessions?.[0];
  return first ? formatClock(new Date(first.startedAt), timeZone) : null;
}
