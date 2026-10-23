import { describe, expect, it } from "vitest";

import { parseTimeOfDay } from "./time";

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
