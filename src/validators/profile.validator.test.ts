import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "./profile.validator";

describe("updateProfileSchema", () => {
  it("accepts a valid display name", () => {
    expect(updateProfileSchema.safeParse({ displayName: "Jane Doe" }).success).toBe(true);
  });

  it("rejects an empty body", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an empty display name", () => {
    expect(updateProfileSchema.safeParse({ displayName: "" }).success).toBe(false);
  });

  it("rejects a display name over 60 characters", () => {
    expect(updateProfileSchema.safeParse({ displayName: "a".repeat(61) }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ displayName: "a".repeat(60) }).success).toBe(true);
  });

  it("enforces school and review center lengths", () => {
    expect(updateProfileSchema.safeParse({ school: "a".repeat(100) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ school: "a".repeat(101) }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ reviewCenter: "a".repeat(101) }).success).toBe(false);
  });

  it("accepts null to clear nullable fields", () => {
    const result = updateProfileSchema.safeParse({
      school: null,
      reviewCenter: null,
      examDate: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a real exam date", () => {
    expect(updateProfileSchema.safeParse({ examDate: "2027-03-20" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ examDate: "2028-02-29" }).success).toBe(true);
  });

  it("rejects malformed or impossible exam dates", () => {
    expect(updateProfileSchema.safeParse({ examDate: "2027-3-20" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ examDate: "2027-02-30" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ examDate: "2027-13-01" }).success).toBe(false);
  });

  it("accepts IANA zones and UTC, rejects others", () => {
    expect(updateProfileSchema.safeParse({ timeZone: "Asia/Manila" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ timeZone: "UTC" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ timeZone: "Mars/Olympus" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ timeZone: "" }).success).toBe(false);
  });

  it("accepts only light or dark for theme", () => {
    expect(updateProfileSchema.safeParse({ theme: "dark" }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ theme: "blue" }).success).toBe(false);
  });

  it("validates soundOn as a boolean", () => {
    expect(updateProfileSchema.safeParse({ soundOn: false }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ soundOn: "no" }).success).toBe(false);
  });
});
