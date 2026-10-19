import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./auth.validator";

describe("signInSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(signInSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("enforces a password of at least 8 characters", () => {
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "a".repeat(7) }).success).toBe(
      false,
    );
    expect(signUpSchema.safeParse({ email: "a@b.co", password: "a".repeat(8) }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ email: "a@", password: "a".repeat(8) }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "a" }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("enforces a password of at least 8 characters", () => {
    expect(resetPasswordSchema.safeParse({ password: "a".repeat(7) }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: "a".repeat(8) }).success).toBe(true);
  });
});
