import { describe, expect, it } from "vitest";

import {
  applyTemplateSchema,
  createTemplateSchema,
  renameTemplateSchema,
} from "./template.validator";

describe("template validators", () => {
  it("trims names and enforces 1 to 60 characters", () => {
    expect(createTemplateSchema.parse({ name: "  Weekday  ", fromDate: "2026-01-15" }).name).toBe(
      "Weekday",
    );
    expect(renameTemplateSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(renameTemplateSchema.safeParse({ name: "a".repeat(60) }).success).toBe(true);
    expect(renameTemplateSchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
  });

  it("requires a valid fromDate", () => {
    expect(createTemplateSchema.safeParse({ name: "x", fromDate: "2026-13-01" }).success).toBe(
      false,
    );
  });

  it("accepts apply with an optional preview flag", () => {
    expect(applyTemplateSchema.safeParse({ date: "2026-01-15" }).success).toBe(true);
    expect(applyTemplateSchema.safeParse({ date: "2026-01-15", preview: true }).success).toBe(true);
    expect(applyTemplateSchema.safeParse({ preview: true }).success).toBe(false);
  });
});
