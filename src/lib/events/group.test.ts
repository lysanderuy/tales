import { describe, expect, it } from "vitest";

import { groupEvents } from "./group";

describe("groupEvents", () => {
  it("splits upcoming from past and keeps the given order", () => {
    const events = [
      { id: "a", state: "ready_to_close" as const },
      { id: "b", state: "upcoming" as const },
      { id: "c", state: "closed" as const },
      { id: "d", state: "upcoming" as const },
    ];
    const { upcoming, past } = groupEvents(events);
    expect(upcoming.map((event) => event.id)).toEqual(["b", "d"]);
    expect(past.map((event) => event.id)).toEqual(["a", "c"]);
  });

  it("returns empty groups for no events", () => {
    expect(groupEvents([])).toEqual({ upcoming: [], past: [] });
  });
});
