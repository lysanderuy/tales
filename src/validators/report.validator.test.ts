import { describe, expect, it } from "vitest";

import { reportQuerySchema } from "./report.validator";

describe("reportQuerySchema", () => {
  it("defaults to the last 7 days", () => {
    expect(reportQuerySchema.parse({}).range).toBe("last7");
  });
  it("accepts each preset", () => {
    for (const range of ["last7", "last30", "thisWeek", "all"]) {
      expect(reportQuerySchema.safeParse({ range }).success).toBe(true);
    }
  });
  it("needs from and to for a custom range", () => {
    expect(reportQuerySchema.safeParse({ range: "custom" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ range: "custom", from: "2026-01-01" }).success).toBe(
      false,
    );
    expect(
      reportQuerySchema.safeParse({ range: "custom", from: "2026-01-01", to: "2026-01-31" })
        .success,
    ).toBe(true);
  });
  it("rejects a reversed custom range", () => {
    expect(
      reportQuerySchema.safeParse({ range: "custom", from: "2026-02-01", to: "2026-01-31" })
        .success,
    ).toBe(false);
  });
  it("rejects a custom range longer than ten years", () => {
    expect(
      reportQuerySchema.safeParse({ range: "custom", from: "2000-01-01", to: "2026-01-01" })
        .success,
    ).toBe(false);
  });
  it("rejects from and to on a preset", () => {
    expect(
      reportQuerySchema.safeParse({ range: "last7", from: "2026-01-01", to: "2026-01-02" }).success,
    ).toBe(false);
  });
  it("rejects an impossible date", () => {
    expect(
      reportQuerySchema.safeParse({ range: "custom", from: "2026-02-30", to: "2026-03-01" })
        .success,
    ).toBe(false);
  });
  it("accepts a node ID and rejects a bad one", () => {
    expect(
      reportQuerySchema.safeParse({ nodeId: "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90" }).success,
    ).toBe(true);
    expect(reportQuerySchema.safeParse({ nodeId: "x" }).success).toBe(false);
  });
});
