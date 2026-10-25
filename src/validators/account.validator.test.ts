import { describe, expect, it } from "vitest";

import { changePasswordSchema, deleteAccountSchema } from "./account.validator";

describe("deleteAccountSchema", () => {
  it("accepts a non-empty password", () => {
    expect(deleteAccountSchema.safeParse({ password: "hunter2" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(deleteAccountSchema.safeParse({ password: "" }).success).toBe(false);
  });

  it("rejects a missing or non-string password", () => {
    expect(deleteAccountSchema.safeParse({}).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: 123 }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a current password and a new one of 8 to 72 characters", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "a".repeat(8) })
        .success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "a".repeat(72) })
        .success,
    ).toBe(true);
  });

  it("rejects a short or too long new password", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "a".repeat(7) })
        .success,
    ).toBe(false);
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "a".repeat(73) })
        .success,
    ).toBe(false);
  });

  it("rejects an empty or missing current password", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "", newPassword: "longenough" }).success,
    ).toBe(false);
    expect(changePasswordSchema.safeParse({ newPassword: "longenough" }).success).toBe(false);
  });
});
