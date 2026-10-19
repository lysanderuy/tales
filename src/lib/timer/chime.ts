export interface CountdownSample {
  key: string;
  over: boolean;
}

export function countdownKey(sessionId: string, plannedMinutes: number): string {
  return `${sessionId}:${plannedMinutes}`;
}

// Chime only on an observed running-countdown to overtime flip; the first sample is a baseline.
export function shouldChime(prev: CountdownSample | null, next: CountdownSample | null): boolean {
  return prev !== null && next !== null && prev.key === next.key && !prev.over && next.over;
}
