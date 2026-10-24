import { sessionActiveSeconds, type ClockSession } from "./clock";

export type FaviconTone = "run" | "overtime" | "paused";

export interface FaviconState {
  progress: number;
  tone: FaviconTone;
}

const LAP_SECONDS = 3600;
const MIN_PROGRESS = 0.02;

export function quantizeProgress(progress: number, steps = 50): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.round(clamped * steps) / steps;
}

export function faviconState(session: ClockSession, serverNowMs: number): FaviconState {
  const active = sessionActiveSeconds(session, serverNowMs);
  const paused = session.state === "paused";

  if (session.plannedMinutes === null) {
    const lap = Math.max(MIN_PROGRESS, (active % LAP_SECONDS) / LAP_SECONDS);
    return { progress: lap, tone: paused ? "paused" : "run" };
  }

  const planned = session.plannedMinutes * 60;
  const over = active >= planned;
  const progress = over ? 1 : (planned - active) / planned;
  return { progress, tone: paused ? "paused" : over ? "overtime" : "run" };
}
