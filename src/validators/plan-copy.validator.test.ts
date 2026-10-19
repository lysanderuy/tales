import { describe, expect, it } from "vitest";

import { copyDaySchema, repeatDaySchema } from "./plan-copy.validator";

describe("copyDaySchema", () => {
  it("dedupes target dates", () => {
    const parsed = copyDaySchema.parse({
      sourceDate: "2026-01-15",
      targetDates: ["2026-01-16", "2026-01-16", "2026-01-17"],
    });
    expect(parsed.targetDates).toEqual(["2026-01-16", "2026-01-17"]);
  });

  it("rejects empty and oversized target lists and bad dates", () => {
    expect(copyDaySchema.safeParse({ sourceDate: "2026-01-15", targetDates: [] }).success).toBe(
      false,
    );
    const tooMany = Array.from(
      { length: 61 },
      (_, i) => `2026-01-${String(i + 1).padStart(2, "0")}`,
    );
    expect(
      copyDaySchema.safeParse({ sourceDate: "2026-01-15", targetDates: tooMany }).success,
    ).toBe(false);
    expect(
      copyDaySchema.safeParse({ sourceDate: "2026-02-30", targetDates: ["2026-01-16"] }).success,
    ).toBe(false);
  });
});

describe("repeatDaySchema", () => {
  const base = { sourceDate: "2026-01-15", weekdays: [3, 1, 3], endDate: "2026-02-15" };

  it("sorts and dedupes weekdays", () => {
    expect(repeatDaySchema.parse(base).weekdays).toEqual([1, 3]);
  });

  it("requires weekdays in range and an end after the source", () => {
    expect(repeatDaySchema.safeParse({ ...base, weekdays: [] }).success).toBe(false);
    expect(repeatDaySchema.safeParse({ ...base, weekdays: [0] }).success).toBe(false);
    expect(repeatDaySchema.safeParse({ ...base, weekdays: [8] }).success).toBe(false);
    expect(repeatDaySchema.safeParse({ ...base, endDate: "2026-01-15" }).success).toBe(false);
    expect(repeatDaySchema.safeParse({ ...base, preview: true }).success).toBe(true);
  });
});
