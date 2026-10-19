import { describe, expect, it } from "vitest";

import { eventState, markableNodeIds } from "./state";

const manila = "Asia/Manila";

describe("eventState with a time", () => {
  const event = { date: "2026-03-02", time: "09:30:00", closedAt: null };

  it("is upcoming just before the exact instant", () => {
    expect(eventState(event, new Date("2026-03-02T01:29:59.999Z"), manila)).toBe("upcoming");
  });

  it("is ready to close at the exact instant", () => {
    expect(eventState(event, new Date("2026-03-02T01:30:00.000Z"), manila)).toBe("ready_to_close");
  });

  it("follows the time zone", () => {
    const now = new Date("2026-03-02T01:30:00.000Z");
    expect(eventState(event, now, "UTC")).toBe("upcoming");
    expect(eventState(event, now, manila)).toBe("ready_to_close");
  });

  it("accepts HH:mm", () => {
    expect(eventState({ ...event, time: "09:30" }, new Date("2026-03-02T01:30:00Z"), manila)).toBe(
      "ready_to_close",
    );
  });
});

describe("eventState with a date only", () => {
  const event = { date: "2026-03-02", time: null, closedAt: null };

  it("stays upcoming through the whole day", () => {
    expect(eventState(event, new Date("2026-03-02T15:59:59.999Z"), manila)).toBe("upcoming");
  });

  it("is ready at the start of the next local day", () => {
    expect(eventState(event, new Date("2026-03-02T16:00:00.000Z"), manila)).toBe("ready_to_close");
  });

  it("is upcoming before its date", () => {
    expect(eventState(event, new Date("2026-02-20T00:00:00Z"), manila)).toBe("upcoming");
  });
});

describe("eventState when closed", () => {
  it("stays closed whatever the time", () => {
    const closed = { date: "2026-03-02", time: null, closedAt: new Date("2026-03-03T00:00:00Z") };
    expect(eventState(closed, new Date("2026-03-03T00:00:00Z"), manila)).toBe("closed");
    expect(eventState(closed, new Date("2030-01-01T00:00:00Z"), manila)).toBe("closed");
    expect(eventState(closed, new Date("2026-01-01T00:00:00Z"), manila)).toBe("closed");
  });
});

describe("markableNodeIds", () => {
  it("is the union without duplicates", () => {
    expect(markableNodeIds(["a", "b"], ["b", "c"]).sort()).toEqual(["a", "b", "c"]);
  });

  it("handles empty inputs", () => {
    expect(markableNodeIds([], [])).toEqual([]);
  });
});
