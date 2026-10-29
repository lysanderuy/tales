import { describe, expect, it } from "vitest";

import {
  endOfSpan,
  formatClockRange,
  formatTimeOfDay,
  minutesBetween,
  parseTimeOfDay,
} from "./time";

describe("formatTimeOfDay", () => {
  it("formats lowercase with no space", () => {
    expect(formatTimeOfDay("00:00")).toBe("12:00am");
    expect(formatTimeOfDay("08:30")).toBe("8:30am");
    expect(formatTimeOfDay("12:00")).toBe("12:00pm");
    expect(formatTimeOfDay("13:05")).toBe("1:05pm");
    expect(formatTimeOfDay("23:59")).toBe("11:59pm");
  });
});

describe("endOfSpan", () => {
  it("adds minutes to a start", () => {
    expect(endOfSpan("08:00", 90)).toEqual({ clock: "09:30", nextDay: false });
  });

  it("wraps past midnight", () => {
    expect(endOfSpan("22:00", 180)).toEqual({ clock: "01:00", nextDay: true });
    expect(endOfSpan("22:00", 120)).toEqual({ clock: "00:00", nextDay: true });
  });
});

describe("minutesBetween", () => {
  it("measures forward, wrapping past midnight", () => {
    expect(minutesBetween("08:00", "09:30")).toBe(90);
    expect(minutesBetween("22:00", "01:00")).toBe(180);
    expect(minutesBetween("08:00", "08:00")).toBe(1440);
  });
});

describe("formatClockRange", () => {
  it("shows a start alone, or a start and end", () => {
    expect(formatClockRange("09:00", null)).toBe("9:00am");
    expect(formatClockRange("22:00", "01:00")).toBe("10:00pm–1:00am");
  });

  it("drops the first am/pm when both sides match", () => {
    expect(formatClockRange("09:00", "11:30")).toBe("9:00–11:30am");
    expect(formatClockRange("22:00", "23:15")).toBe("10:00–11:15pm");
    expect(formatClockRange("11:30", "12:15")).toBe("11:30am–12:15pm");
  });

  it("uses the running label when there is no end", () => {
    expect(formatClockRange("09:00", null, "")).toBe("9:00am–");
    expect(formatClockRange("09:00", null, "now")).toBe("9:00am–now");
  });
});

function ok(raw: string): string | null | undefined {
  const result = parseTimeOfDay(raw);
  return result.ok ? result.value : undefined;
}

describe("parseTimeOfDay", () => {
  it("treats blank input as no time", () => {
    expect(ok("")).toBeNull();
    expect(ok("   ")).toBeNull();
  });

  it("accepts digits without a colon", () => {
    expect(ok("830")).toBe("08:30");
    expect(ok("0830")).toBe("08:30");
    expect(ok("1230")).toBe("12:30");
    expect(ok("2359")).toBe("23:59");
    expect(ok("8")).toBe("08:00");
    expect(ok("20")).toBe("20:00");
  });

  it("accepts a colon with one or two hour digits", () => {
    expect(ok("8:30")).toBe("08:30");
    expect(ok("08:30")).toBe("08:30");
    expect(ok("20:30")).toBe("20:30");
    expect(ok("0:00")).toBe("00:00");
    expect(ok(" 7:05 ")).toBe("07:05");
  });

  it("converts 12-hour times", () => {
    expect(ok("8:30pm")).toBe("20:30");
    expect(ok("8:30 PM")).toBe("20:30");
    expect(ok("8:30am")).toBe("08:30");
    expect(ok("12am")).toBe("00:00");
    expect(ok("12pm")).toBe("12:00");
    expect(ok("12:15 a.m.")).toBe("00:15");
    expect(ok("830p")).toBe("20:30");
    expect(ok("9 pm")).toBe("21:00");
  });

  it("rejects out-of-range values", () => {
    expect(ok("24:00")).toBeUndefined();
    expect(ok("8:60")).toBeUndefined();
    expect(ok("2460")).toBeUndefined();
    expect(ok("13pm")).toBeUndefined();
    expect(ok("0am")).toBeUndefined();
    expect(ok("99")).toBeUndefined();
  });

  it("rejects malformed text", () => {
    expect(ok("abc")).toBeUndefined();
    expect(ok("8:3")).toBeUndefined();
    expect(ok("8:30:15")).toBeUndefined();
    expect(ok("12345")).toBeUndefined();
    expect(ok("8-30")).toBeUndefined();
    expect(ok("pm")).toBeUndefined();
  });
});
