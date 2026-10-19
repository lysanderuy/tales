import { describe, expect, it } from "vitest";

import { daysInRange, resolveRange } from "./ranges";

const base = { todayKey: "2026-01-15", earliestKey: null };

describe("resolveRange", () => {
  it("last7 is seven days including today", () => {
    expect(resolveRange({ ...base, range: "last7" })).toEqual({
      fromKey: "2026-01-09",
      toKey: "2026-01-15",
    });
  });
  it("last30 is thirty days including today", () => {
    expect(resolveRange({ ...base, range: "last30" })).toEqual({
      fromKey: "2025-12-17",
      toKey: "2026-01-15",
    });
  });
  it("thisWeek runs Monday to today", () => {
    expect(resolveRange({ ...base, range: "thisWeek" })).toEqual({
      fromKey: "2026-01-12",
      toKey: "2026-01-15",
    });
  });
  it("thisWeek on a Monday is just today", () => {
    expect(resolveRange({ ...base, todayKey: "2026-01-12", range: "thisWeek" })).toEqual({
      fromKey: "2026-01-12",
      toKey: "2026-01-12",
    });
  });
  it("thisWeek on a Sunday reaches back to Monday", () => {
    expect(resolveRange({ ...base, todayKey: "2026-01-18", range: "thisWeek" }).fromKey).toBe(
      "2026-01-12",
    );
  });
  it("custom uses the given days", () => {
    expect(
      resolveRange({ ...base, range: "custom", from: "2026-01-01", to: "2026-01-02" }),
    ).toEqual({ fromKey: "2026-01-01", toKey: "2026-01-02" });
  });
  it("custom allows a single day", () => {
    expect(
      resolveRange({ ...base, range: "custom", from: "2026-01-01", to: "2026-01-01" }),
    ).toEqual({ fromKey: "2026-01-01", toKey: "2026-01-01" });
  });
  it("custom rejects a reversed or missing range", () => {
    expect(() =>
      resolveRange({ ...base, range: "custom", from: "2026-01-03", to: "2026-01-02" }),
    ).toThrow(RangeError);
    expect(() => resolveRange({ ...base, range: "custom", from: "2026-01-03" })).toThrow(
      RangeError,
    );
  });
  it("all starts at the earliest day", () => {
    expect(resolveRange({ ...base, range: "all", earliestKey: "2025-11-02" })).toEqual({
      fromKey: "2025-11-02",
      toKey: "2026-01-15",
    });
  });
  it("all with no time is just today", () => {
    expect(resolveRange({ ...base, range: "all" })).toEqual({
      fromKey: "2026-01-15",
      toKey: "2026-01-15",
    });
  });
});

describe("daysInRange", () => {
  it("lists every day inclusive, oldest first", () => {
    expect(daysInRange({ fromKey: "2026-02-27", toKey: "2026-03-02" })).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });
});
