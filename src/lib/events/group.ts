import type { EventState } from "@/lib/events/state";

export function groupEvents<T extends { state: EventState }>(
  events: readonly T[],
): { upcoming: T[]; past: T[] } {
  return {
    upcoming: events.filter((event) => event.state === "upcoming"),
    past: events.filter((event) => event.state !== "upcoming"),
  };
}
