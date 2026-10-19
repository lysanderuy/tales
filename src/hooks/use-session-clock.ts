"use client";

import { useSyncExternalStore } from "react";

import { useCurrentSession } from "@/hooks/use-current-session";
import { clockDisplay, clockOffset, type ClockDisplay } from "@/lib/timer/clock";
import type { SessionResponse } from "@/validators/study-session.validator";

const TICK_MS = 250;

const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

function subscribeToTicks(listener: () => void): () => void {
  listeners.add(listener);
  interval ??= setInterval(() => listeners.forEach((notify) => notify()), TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

function subscribeToNothing(): () => void {
  return () => {};
}

function snapshot(): number {
  return Math.floor(Date.now() / TICK_MS) * TICK_MS;
}

function serverSnapshot(): number {
  return 0;
}

export interface SessionClock {
  session: SessionResponse | null;
  display: ClockDisplay | null;
}

export function useSessionClock(): SessionClock {
  const { data, dataUpdatedAt } = useCurrentSession();
  const candidate = data?.session ?? null;
  const session = candidate && candidate.state !== "stopped" ? candidate : null;
  const running = session?.state === "running";

  const clientNow = useSyncExternalStore(
    running ? subscribeToTicks : subscribeToNothing,
    snapshot,
    serverSnapshot,
  );

  if (!session || !data) return { session: null, display: null };

  const offset = clockOffset(data.serverNow, dataUpdatedAt);
  const now = clientNow + offset;
  return { session, display: clockDisplay(session, now) };
}
