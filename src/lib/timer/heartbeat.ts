import { STALE_THRESHOLD_MINUTES } from "@/lib/timer/timer";

export type HeartbeatDecision = "send" | "hold" | "refetch";

export interface HeartbeatInput {
  handled: boolean;
  stale: boolean;
  lastHeartbeatMs: number;
  serverNowMs: number;
}

// A heartbeat would erase the evidence the Welcome back prompt needs, so it is withheld until
// the prompt is handled; a long gap means the server decides, via a refetch.
export function decideHeartbeat(input: HeartbeatInput): HeartbeatDecision {
  if (input.handled) return "send";
  if (input.stale) return "hold";
  const gapMs = input.serverNowMs - input.lastHeartbeatMs;
  return gapMs >= STALE_THRESHOLD_MINUTES * 60_000 ? "refetch" : "send";
}
