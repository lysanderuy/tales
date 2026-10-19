import { describe, expect, it } from "vitest";

import { addDays, dayRangeUtc, formatClock, localDateKey, mondayOf } from "./zone";

describe("localDateKey", () => {
  it("uses the local calendar day", () => {
    const instant = new Date("2026-03-01T17:30:00Z");
    expect(localDateKey(instant, "Asia/Manila")).toBe("2026-03-02");
    expect(localDateKey(instant, "America/New_York")).toBe("2026-03-01");
    expect(localDateKey(instant, "UTC")).toBe("2026-03-01");
  });
});

describe("dayRangeUtc", () => {
  it("covers a Manila day", () => {
    const { start, end } = dayRangeUtc("2026-03-02", "Asia/Manila");
    expect(start.toISOString()).toBe("2026-03-01T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-02T16:00:00.000Z");
  });

  it("covers a normal New York day", () => {
    const { start, end } = dayRangeUtc("2026-01-15", "America/New_York");
    expect(start.toISOString()).toBe("2026-01-15T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-16T05:00:00.000Z");
  });

  it("is 23 hours on the spring-forward day", () => {
    const { start, end } = dayRangeUtc("2026-03-08", "America/New_York");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("is 25 hours on the fall-back day", () => {
    const { start, end } = dayRangeUtc("2026-11-01", "America/New_York");
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("round-trips with localDateKey at the edges", () => {
    const { start, end } = dayRangeUtc("2026-03-08", "America/New_York");
    expect(localDateKey(start, "America/New_York")).toBe("2026-03-08");
    expect(localDateKey(new Date(end.getTime() - 1), "America/New_York")).toBe("2026-03-08");
    expect(localDateKey(end, "America/New_York")).toBe("2026-03-09");
  });

  it("rejects malformed keys", () => {
    expect(() => dayRangeUtc("2026-3-2", "UTC")).toThrow(RangeError);
  });
});

describe("addDays and mondayOf", () => {
  it("adds across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("finds the Monday of the week", () => {
    expect(mondayOf("2026-03-02")).toBe("2026-03-02");
    expect(mondayOf("2026-03-08")).toBe("2026-03-02");
    expect(mondayOf("2026-03-04")).toBe("2026-03-02");
    expect(mondayOf("2026-01-01")).toBe("2025-12-29");
  });
});

describe("formatClock", () => {
  it("formats 24-hour local time", () => {
    const instant = new Date("2026-03-01T17:05:00Z");
    expect(formatClock(instant, "Asia/Manila")).toBe("01:05");
    expect(formatClock(instant, "America/New_York")).toBe("12:05");
    expect(formatClock(new Date("2026-03-01T05:00:00Z"), "America/New_York")).toBe("00:00");
  });
});
