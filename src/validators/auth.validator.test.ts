import { describe, expect, it } from "vitest";

import { findBannedWords } from "@/lib/copy/banned-words";

import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./auth.validator";

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("signInSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("asks for the email when empty", () => {
    expect(firstMessage(signInSchema.safeParse({ email: "", password: "x" }))).toBe(
      "Enter your email.",
    );
  });

  it("asks for a valid email when malformed", () => {
    expect(firstMessage(signInSchema.safeParse({ email: "nope", password: "x" }))).toBe(
      "Enter a valid email.",
    );
  });

  it("asks for the password when empty", () => {
    expect(firstMessage(signInSchema.safeParse({ email: "a@b.co", password: "" }))).toBe(
      "Enter your password.",
    );
  });
});

describe("signUpSchema", () => {
  const valid = { displayName: "Maria Santos", email: "a@b.co", password: "a".repeat(8) };

  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("enforces a password of at least 8 characters", () => {
    const short = signUpSchema.safeParse({ ...valid, password: "a".repeat(7) });
    expect(firstMessage(short)).toBe("Password needs at least 8 characters.");
  });

  it("rejects an empty or blank display name", () => {
    expect(firstMessage(signUpSchema.safeParse({ ...valid, displayName: "" }))).toBe(
      "Enter a display name.",
    );
    expect(firstMessage(signUpSchema.safeParse({ ...valid, displayName: "   " }))).toBe(
      "Enter a display name.",
    );
  });

  it("trims the display name and caps it at 60 characters", () => {
    const trimmed = signUpSchema.parse({ ...valid, displayName: "  Maria  " });
    expect(trimmed.displayName).toBe("Maria");
    expect(signUpSchema.safeParse({ ...valid, displayName: "a".repeat(60) }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...valid, displayName: "a".repeat(61) }).success).toBe(false);
  });

  it("asks for a valid email", () => {
    expect(firstMessage(signUpSchema.safeParse({ ...valid, email: "a@" }))).toBe(
      "Enter a valid email.",
    );
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(firstMessage(forgotPasswordSchema.safeParse({ email: "a" }))).toBe(
      "Enter a valid email.",
    );
    expect(firstMessage(forgotPasswordSchema.safeParse({ email: "" }))).toBe("Enter your email.");
  });
});

describe("resetPasswordSchema", () => {
  it("enforces a password of at least 8 characters", () => {
    expect(firstMessage(resetPasswordSchema.safeParse({ password: "a".repeat(7) }))).toBe(
      "Password needs at least 8 characters.",
    );
    expect(resetPasswordSchema.safeParse({ password: "a".repeat(8) }).success).toBe(true);
  });
});

describe("auth validation copy", () => {
  it("has no banned words", () => {
    const messages = [
      signInSchema.safeParse({ email: "", password: "" }),
      signUpSchema.safeParse({ displayName: "", email: "x", password: "" }),
    ].flatMap((r) => r.error?.issues.map((i) => i.message) ?? []);
    for (const message of messages) expect(findBannedWords(message)).toEqual([]);
  });
});
