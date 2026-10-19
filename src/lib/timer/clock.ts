import { messages } from "@/lib/messages";
import { activeSeconds, type TimerState } from "@/lib/timer/timer";

export interface ClockSession {
  startedAt: string;
  endedAt: string | null;
  state: TimerState;
  plannedMinutes: number | null;
  pauses: readonly { pausedAt: string; resumedAt: string | null }[];
}

export interface ClockDisplay {
  text: string;
  over: boolean;
  paused: boolean;
}

// The server clock is authoritative: a wrong laptop clock must not skew the timer.
export function clockOffset(serverNow: string, clientNowMs: number): number {
  return Date.parse(serverNow) - clientNowMs;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.floor(Math.max(0, totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const seconds = String(s % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

export function sessionActiveSeconds(session: ClockSession, serverNowMs: number): number {
  return activeSeconds(
    {
      startedAt: new Date(session.startedAt),
      endedAt: session.endedAt ? new Date(session.endedAt) : null,
      pauses: session.pauses.map((pause) => ({
        pausedAt: new Date(pause.pausedAt),
        resumedAt: pause.resumedAt ? new Date(pause.resumedAt) : null,
      })),
    },
    new Date(serverNowMs),
  );
}

export function clockDisplay(session: ClockSession, serverNowMs: number): ClockDisplay {
  const active = sessionActiveSeconds(session, serverNowMs);
  const paused = session.state === "paused";

  if (session.plannedMinutes === null) {
    return { text: formatClock(active), over: false, paused };
  }

  const left = session.plannedMinutes * 60 - active;
  if (left > 0) return { text: formatClock(left), over: false, paused };
  return { text: `+${formatClock(-left)}`, over: !paused, paused };
}

export function tabTitle(
  session: Pick<ClockSession, "plannedMinutes"> | null,
  display: ClockDisplay | null,
  subjectName: string | null,
): string {
  if (!session || !display) return messages.appName;
  const name = subjectName ?? messages.timerStudying;
  if (display.paused) return `${messages.timerPaused} · ${name}`;
  const isCountdown = session.plannedMinutes !== null && !display.over;
  return isCountdown
    ? `${display.text} ${messages.timerLeft} · ${name}`
    : `${display.text} · ${name}`;
}
