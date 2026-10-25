import { describe, expect, it } from "vitest";

import {
  bulkDailyLinesSchema,
  createDailyLineSchema,
  createDailySetSchema,
  renameDailySetSchema,
  todaysLineSchema,
  updateDailyLineSchema,
} from "./daily-set.validator";

describe("daily set validators", () => {
  it("trims set names and enforces 1 to 60 characters", () => {
    expect(createDailySetSchema.parse({ name: "  Mine  " }).name).toBe("Mine");
    expect(createDailySetSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(renameDailySetSchema.safeParse({ name: "a".repeat(60) }).success).toBe(true);
    expect(renameDailySetSchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
  });

  it("enforces 1 to 500 characters on lines", () => {
    expect(createDailyLineSchema.safeParse({ text: "" }).success).toBe(false);
    expect(createDailyLineSchema.safeParse({ text: "a".repeat(500) }).success).toBe(true);
    expect(updateDailyLineSchema.safeParse({ text: "a".repeat(501) }).success).toBe(false);
  });

  it("accepts a pasted block with an optional preview flag", () => {
    expect(bulkDailyLinesSchema.safeParse({ text: "a\nb" }).success).toBe(true);
    expect(bulkDailyLinesSchema.safeParse({ text: "a", preview: true }).success).toBe(true);
    expect(bulkDailyLinesSchema.safeParse({ preview: true }).success).toBe(false);
  });

  it("allows today's line to be null", () => {
    expect(todaysLineSchema.safeParse(null).success).toBe(true);
  });
});
