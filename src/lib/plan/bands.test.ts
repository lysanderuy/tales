import { describe, expect, it } from "vitest";

import { bandOf, groupIntoBands, startsOffPlan } from "@/lib/plan/bands";

describe("bandOf", () => {
  it("splits the day at 12:00 and 18:00", () => {
    expect(bandOf("00:00")).toBe("morning");
    expect(bandOf("11:59")).toBe("morning");
    expect(bandOf("12:00")).toBe("afternoon");
    expect(bandOf("17:59")).toBe("afternoon");
    expect(bandOf("18:00")).toBe("evening");
    expect(bandOf("23:59")).toBe("evening");
  });

  it("treats a missing time as unscheduled", () => {
    expect(bandOf(null)).toBe("unscheduled");
  });
});

describe("groupIntoBands", () => {
  type Item = { id: string; clock: string | null; position: number };
  const group = (items: Item[]) =>
    groupIntoBands(
      items,
      (item) => item.clock,
      (item) => item.position,
    ).map((entry) => ({ band: entry.band, ids: entry.items.map((item) => item.id) }));

  it("orders bands and omits empty ones", () => {
    expect(
      group([
        { id: "u", clock: null, position: 0 },
        { id: "e", clock: "19:00", position: 1 },
        { id: "m", clock: "08:00", position: 2 },
      ]),
    ).toEqual([
      { band: "morning", ids: ["m"] },
      { band: "evening", ids: ["e"] },
      { band: "unscheduled", ids: ["u"] },
    ]);
  });

  it("sorts by time, then position, and unscheduled by position", () => {
    expect(
      group([
        { id: "b", clock: "09:00", position: 1 },
        { id: "a", clock: "09:00", position: 0 },
        { id: "early", clock: "07:30", position: 5 },
        { id: "u2", clock: null, position: 3 },
        { id: "u1", clock: null, position: 2 },
      ]),
    ).toEqual([
      { band: "morning", ids: ["early", "a", "b"] },
      { band: "unscheduled", ids: ["u1", "u2"] },
    ]);
  });

  it("returns nothing for no items", () => {
    expect(group([])).toEqual([]);
  });
});

describe("startsOffPlan", () => {
  it("flags a difference of 10 minutes or more in either direction", () => {
    expect(startsOffPlan("08:00", "08:09")).toBe(false);
    expect(startsOffPlan("08:00", "08:10")).toBe(true);
    expect(startsOffPlan("08:00", "07:51")).toBe(false);
    expect(startsOffPlan("08:00", "07:50")).toBe(true);
  });

  it("measures the gap across midnight", () => {
    expect(startsOffPlan("23:55", "00:05")).toBe(true);
    expect(startsOffPlan("23:55", "00:04")).toBe(false);
    expect(startsOffPlan("00:05", "23:56")).toBe(false);
  });
});
