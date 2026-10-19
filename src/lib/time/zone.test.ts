import { describe, expect, it } from "vitest";

import { addDays, dayRangeUtc, formatClock, localDateKey, mondayOf, zonedInstant } from "./zone";

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

describe("zonedInstant", () => {
  it("converts Manila wall time to UTC", () => {
    expect(zonedInstant("2026-03-02", "09:30", "Asia/Manila").toISOString()).toBe(
      "2026-03-02T01:30:00.000Z",
    );
  });

  it("matches local midnight from dayRangeUtc", () => {
    expect(zonedInstant("2026-03-02", "00:00", "Asia/Manila").getTime()).toBe(
      dayRangeUtc("2026-03-02", "Asia/Manila").start.getTime(),
    );
  });

  it("uses the offset in force on that date", () => {
    expect(zonedInstant("2026-01-15", "12:00", "America/New_York").toISOString()).toBe(
      "2026-01-15T17:00:00.000Z",
    );
    expect(zonedInstant("2026-07-15", "12:00", "America/New_York").toISOString()).toBe(
      "2026-07-15T16:00:00.000Z",
    );
  });

  it("handles times either side of a DST change", () => {
    expect(zonedInstant("2026-03-08", "01:30", "America/New_York").toISOString()).toBe(
      "2026-03-08T06:30:00.000Z",
    );
    expect(zonedInstant("2026-03-08", "03:30", "America/New_York").toISOString()).toBe(
      "2026-03-08T07:30:00.000Z",
    );
  });

  it("rejects a malformed clock", () => {
    expect(() => zonedInstant("2026-03-02", "9:30", "Asia/Manila")).toThrow(RangeError);
  });
});
