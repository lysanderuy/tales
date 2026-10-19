import { describe, expect, it } from "vitest";

import {
  allocateMinutes,
  formatDateEyebrow,
  formatDayLabel,
  formatDaysAway,
  formatEventSub,
  formatHoursLabel,
  formatMinutes,
  formatProgress,
  formatSeconds,
  formatTimeRanges,
  progressPercent,
  secondsToMinutes,
  splitTotal,
} from "./format";

describe("formatMinutes", () => {
  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 h"],
    [70, "1 h 10 min"],
    [125, "2 h 5 min"],
  ])("%i -> %s", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});

describe("seconds rounding", () => {
  it("rounds to the nearest minute", () => {
    expect(secondsToMinutes(29)).toBe(0);
    expect(secondsToMinutes(30)).toBe(1);
    expect(secondsToMinutes(2100)).toBe(35);
  });

  it("formats and splits from seconds", () => {
    expect(formatSeconds(4200)).toBe("1 h 10 min");
    expect(splitTotal(5100)).toEqual({ hours: 1, minutes: 25 });
    expect(splitTotal(1500)).toEqual({ hours: 0, minutes: 25 });
  });
});

describe("formatProgress", () => {
  it("reads planned progress", () => {
    expect(formatProgress(60, 2100)).toBe("35 of 60 min");
    expect(formatProgress(60, 4500)).toBe("75 of 60 min");
  });

  it("reads open-ended progress as plain duration", () => {
    expect(formatProgress(null, 0)).toBe("0 min");
    expect(formatProgress(null, 1800)).toBe("30 min");
  });
});

describe("progressPercent", () => {
  it("caps at 100", () => {
    expect(progressPercent(60, 1800)).toBe(50);
    expect(progressPercent(60, 4500)).toBe(100);
    expect(progressPercent(0, 100)).toBe(0);
  });
});

describe("date labels", () => {
  it("builds the eyebrow without timezone shifts", () => {
    expect(formatDateEyebrow("2026-10-19")).toBe("Monday · Oct 19");
    expect(formatDateEyebrow("2026-01-01")).toBe("Thursday · Jan 1");
  });

  it("builds chart day labels", () => {
    expect(formatDayLabel("2026-10-19")).toBe("Mon 19");
    expect(formatDayLabel("2026-10-05")).toBe("Mon 5");
  });

  it("reads days away", () => {
    expect(formatDaysAway(0)).toBe("today");
    expect(formatDaysAway(1)).toBe("in 1 day");
    expect(formatDaysAway(5)).toBe("in 5 days");
  });

  it("builds the event sub line", () => {
    expect(formatEventSub({ date: "2026-10-24", time: null, daysAway: 5 })).toBe(
      "Sat Oct 24 · in 5 days",
    );
    expect(formatEventSub({ date: "2026-10-19", time: "09:00", daysAway: 0 })).toBe(
      "Mon Oct 19, 09:00 · today",
    );
  });
});

describe("formatHoursLabel", () => {
  it("is empty for zero and one decimal otherwise", () => {
    expect(formatHoursLabel(0)).toBe("");
    expect(formatHoursLabel(9000)).toBe("2.5 h");
  });
});

describe("formatTimeRanges", () => {
  it("joins ranges and labels a running end", () => {
    expect(
      formatTimeRanges(
        [
          { startClock: "13:00", endClock: "13:40" },
          { startClock: "15:00", endClock: null },
        ],
        "now",
      ),
    ).toBe("13:00–13:40, 15:00–now");
  });
});

describe("allocateMinutes", () => {
  it("gives the extra minute to the largest remainder", () => {
    expect(allocateMinutes([1824, 1824], 3648)).toEqual([31, 30]);
  });

  it("leaves exact minutes unchanged", () => {
    expect(allocateMinutes([600, 1200, 60], 1860)).toEqual([10, 20, 1]);
  });

  it("returns an empty list for no rows", () => {
    expect(allocateMinutes([], 0)).toEqual([]);
  });

  it("keeps a zero-second row at zero", () => {
    expect(allocateMinutes([0, 90], 90)).toEqual([0, 2]);
  });

  it("breaks remainder ties by larger seconds, then input order", () => {
    expect(allocateMinutes([90, 150, 90], 330)).toEqual([2, 3, 1]);
    expect(allocateMinutes([30, 30], 60)).toEqual([1, 0]);
  });

  it("sums rows to the rounded total for random inputs", () => {
    for (let run = 0; run < 500; run++) {
      const rows = Array.from({ length: 1 + Math.floor(Math.random() * 8) }, () =>
        Math.floor(Math.random() * 20000),
      );
      const total = rows.reduce((sum, s) => sum + s, 0);
      const result = allocateMinutes(rows, total);
      expect(result.reduce((sum, m) => sum + m, 0)).toBe(secondsToMinutes(total));
      result.forEach((m, i) => {
        expect(Math.abs(m - rows[i] / 60)).toBeLessThan(1);
      });
    }
  });
});
