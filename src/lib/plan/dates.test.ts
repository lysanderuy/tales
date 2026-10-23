import { describe, expect, it } from "vitest";

import {
  clampDate,
  dayDiff,
  dayOfMonth,
  formatDayTitle,
  formatDateLong,
  formatMonthTitle,
  formatWeekRange,
  formatWeekdayShort,
  monthEnd,
  monthGrid,
  monthStart,
  shiftDate,
  shiftMonth,
  weekDates,
} from "./dates";

describe("weekDates", () => {
  it("starts on Monday and covers seven days", () => {
    expect(weekDates("2026-10-23")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  it("treats Sunday as the end of its week", () => {
    expect(weekDates("2026-10-25")[0]).toBe("2026-10-19");
    expect(weekDates("2026-10-26")[0]).toBe("2026-10-26");
  });

  it("crosses month and year boundaries", () => {
    expect(weekDates("2026-12-31")[6]).toBe("2027-01-03");
  });
});

describe("dayDiff", () => {
  it("counts whole days in either direction", () => {
    expect(dayDiff("2026-10-23", "2026-10-26")).toBe(3);
    expect(dayDiff("2026-10-23", "2026-10-20")).toBe(-3);
    expect(dayDiff("2026-10-23", "2026-10-23")).toBe(0);
  });

  it("is unaffected by month length", () => {
    expect(dayDiff("2026-02-27", "2026-03-01")).toBe(2);
  });
});

describe("shiftDate", () => {
  it("moves by days or weeks", () => {
    expect(shiftDate("2026-10-23", 1, "day")).toBe("2026-10-24");
    expect(shiftDate("2026-10-23", -1, "week")).toBe("2026-10-16");
  });
});

describe("labels", () => {
  it("formats day title", () => {
    expect(formatDayTitle("2026-10-23")).toBe("Fri, Oct 23");
  });

  it("formats week range within a month and across months", () => {
    expect(formatWeekRange("2026-10-23")).toBe("Oct 19 – 25");
    expect(formatWeekRange("2026-10-28")).toBe("Oct 26 – Nov 1");
  });

  it("formats weekday and day of month", () => {
    expect(formatWeekdayShort("2026-10-19")).toBe("Mon");
    expect(dayOfMonth("2026-10-05")).toBe(5);
  });
});

describe("month helpers", () => {
  it("finds the month start and end", () => {
    expect(monthStart("2026-10-23")).toBe("2026-10-01");
    expect(monthEnd("2026-10-23")).toBe("2026-10-31");
    expect(monthEnd("2026-02-10")).toBe("2026-02-28");
    expect(monthEnd("2028-02-10")).toBe("2028-02-29");
  });

  it("shifts by months across year boundaries", () => {
    expect(shiftMonth("2026-10-23", 1)).toBe("2026-11-01");
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
    expect(shiftMonth("2026-03-31", -1)).toBe("2026-02-01");
  });

  it("builds a Monday-first grid padded with neighbouring days", () => {
    const grid = monthGrid("2026-10-23");
    expect(grid).toHaveLength(5);
    expect(grid.every((week) => week.length === 7)).toBe(true);
    expect(grid[0][0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(grid[0][3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(grid[4][6]).toEqual({ date: "2026-11-01", inMonth: false });
    expect(grid.flat().filter((cell) => cell.inMonth)).toHaveLength(31);
  });

  it("uses four weeks when the month fits exactly", () => {
    const grid = monthGrid("2027-02-01");
    expect(grid).toHaveLength(4);
    expect(grid[0][0].date).toBe("2027-02-01");
    expect(grid[3][6].date).toBe("2027-02-28");
  });

  it("uses six weeks when needed", () => {
    expect(monthGrid("2026-08-01")).toHaveLength(6);
  });

  it("clamps into the allowed range", () => {
    expect(clampDate("2026-10-23", undefined, "2026-10-20")).toBe("2026-10-20");
    expect(clampDate("2026-10-10", "2026-10-15", undefined)).toBe("2026-10-15");
    expect(clampDate("2026-10-17", "2026-10-15", "2026-10-20")).toBe("2026-10-17");
    expect(clampDate("2026-10-17")).toBe("2026-10-17");
  });

  it("formats titles", () => {
    expect(formatMonthTitle("2026-10-23")).toBe("October 2026");
    expect(formatDateLong("2026-10-23")).toBe("Fri, Oct 23, 2026");
  });
});
