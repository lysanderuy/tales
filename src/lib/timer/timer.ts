export interface TimerPause {
  pausedAt: Date;
  resumedAt: Date | null;
}

export interface TimerRecord {
  startedAt: Date;
  endedAt: Date | null;
  pauses: readonly TimerPause[];
}

export type TimerState = "running" | "paused" | "stopped";

export const STALE_THRESHOLD_MINUTES = 15;

export function activeSeconds(record: TimerRecord, now: Date): number {
  const start = record.startedAt.getTime();
  const end = (record.endedAt ?? now).getTime();
  let pausedMs = 0;
  for (const pause of record.pauses) {
    const from = Math.max(pause.pausedAt.getTime(), start);
    const to = Math.min((pause.resumedAt ?? new Date(end)).getTime(), end);
    if (to > from) pausedMs += to - from;
  }
  return Math.max(0, (end - start - pausedMs) / 1000);
}

export function timerState(record: Pick<TimerRecord, "endedAt" | "pauses">): TimerState {
  if (record.endedAt) return "stopped";
  return record.pauses.some((pause) => pause.resumedAt === null) ? "paused" : "running";
}

export function remainingSeconds(plannedMinutes: number, activeSec: number): number {
  return Math.max(0, plannedMinutes * 60 - activeSec);
}

export function overtimeSeconds(plannedMinutes: number, activeSec: number): number {
  return Math.max(0, activeSec - plannedMinutes * 60);
}

export function extendedPlannedMinutes(activeSec: number, extensionMinutes: number): number {
  return Math.ceil(activeSec / 60) + extensionMinutes;
}

export function isStale(
  lastHeartbeatAt: Date,
  now: Date,
  thresholdMinutes: number = STALE_THRESHOLD_MINUTES,
): boolean {
  return now.getTime() - lastHeartbeatAt.getTime() > thresholdMinutes * 60_000;
}

// Returns null when the candidate is before the start or after now.
export function clampStopTime(candidate: Date, startedAt: Date, now: Date): Date | null {
  const time = candidate.getTime();
  if (Number.isNaN(time) || time < startedAt.getTime() || time > now.getTime()) return null;
  return candidate;
}

export function truncatePauses(pauses: readonly TimerPause[], endAt: Date): TimerPause[] {
  const out: TimerPause[] = [];
  for (const pause of pauses) {
    if (pause.pausedAt.getTime() >= endAt.getTime()) continue;
    const resumedAt =
      pause.resumedAt === null || pause.resumedAt.getTime() > endAt.getTime()
        ? endAt
        : pause.resumedAt;
    out.push({ pausedAt: pause.pausedAt, resumedAt });
  }
  return out;
}
