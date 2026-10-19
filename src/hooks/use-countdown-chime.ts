"use client";

import { useEffect, useRef } from "react";

import { useProfile } from "@/hooks/use-profile";
import { useSessionClock } from "@/hooks/use-session-clock";
import { playChime } from "@/lib/sound/chime";
import { countdownKey, shouldChime, type CountdownSample } from "@/lib/timer/chime";

export function useCountdownChime(): void {
  const { session, display } = useSessionClock();
  const soundOn = useProfile().data?.soundOn ?? true;
  const previous = useRef<CountdownSample | null>(null);

  const key =
    session?.state === "running" && session.plannedMinutes !== null
      ? countdownKey(session.id, session.plannedMinutes)
      : null;
  const over = display?.over ?? false;

  useEffect(() => {
    const next = key === null ? null : { key, over };
    if (shouldChime(previous.current, next) && soundOn) playChime();
    previous.current = next;
  }, [key, over, soundOn]);
}
