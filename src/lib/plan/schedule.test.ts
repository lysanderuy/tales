import { describe, expect, it } from "vitest";

import { MAX_REPEAT_DAYS, ScheduleError, repeatDates, weekdayOf } from "./schedule";

describe("weekdayOf", () => {
  it("numbers Monday as 1 and Sunday as 7", () => {
    expect(weekdayOf("2026-01-12")).toBe(1);
    expect(weekdayOf("2026-01-18")).toBe(7);
    expect(weekdayOf("2026-01-15")).toBe(4);
  });

  it("handles a leap day", () => {
    expect(weekdayOf("2028-02-29")).toBe(2);
  });
});

describe("repeatDates", () => {
  it("returns matching days in order, including both ends", () => {
    expect(repeatDates({ startKey: "2026-01-12", endKey: "2026-01-25", weekdays: [3, 1] })).toEqual(
      ["2026-01-12", "2026-01-14", "2026-01-19", "2026-01-21"],
    );
  });

  it("crosses month and year boundaries", () => {
    expect(repeatDates({ startKey: "2026-12-28", endKey: "2027-01-04", weekdays: [1, 5] })).toEqual(
      ["2026-12-28", "2027-01-01", "2027-01-04"],
    );
  });

  it("includes a leap day", () => {
    expect(repeatDates({ startKey: "2028-02-27", endKey: "2028-03-01", weekdays: [2] })).toEqual([
      "2028-02-29",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(repeatDates({ startKey: "2026-01-12", endKey: "2026-01-13", weekdays: [7] })).toEqual(
      [],
    );
  });

  it("rejects empty weekdays", () => {
    expect(() =>
      repeatDates({ startKey: "2026-01-12", endKey: "2026-01-13", weekdays: [] }),
    ).toThrow(ScheduleError);
  });

  it("rejects an end before the start", () => {
    expect(() =>
      repeatDates({ startKey: "2026-01-13", endKey: "2026-01-12", weekdays: [1] }),
    ).toThrow(ScheduleError);
  });

  it("enforces the span cap", () => {
    expect(
      repeatDates({ startKey: "2026-01-01", endKey: "2026-12-31", weekdays: [1] }).length,
    ).toBeGreaterThan(0);
    expect(MAX_REPEAT_DAYS).toBe(366);
    expect(() =>
      repeatDates({ startKey: "2026-01-01", endKey: "2027-01-02", weekdays: [1] }),
    ).toThrow(ScheduleError);
  });
});
