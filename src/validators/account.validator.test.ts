import { describe, expect, it } from "vitest";

import { deleteAccountSchema } from "./account.validator";

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
