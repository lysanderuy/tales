import { describe, expect, it } from "vitest";
import { z } from "zod";

import { collectFieldErrors, firstInvalidField } from "./field-errors";

const order = ["email", "password"] as const;
const schema = z.object({ email: z.email("bad email"), password: z.string().min(8, "too short") });

describe("collectFieldErrors", () => {
  it("keeps the first message per field and skips valid fields", () => {
    const result = schema.safeParse({ email: "a@b.co", password: "x" });
    if (result.success) throw new Error("expected failure");
    expect(collectFieldErrors(result.error, order)).toEqual({ password: "too short" });
  });
});

describe("firstInvalidField", () => {
  it("returns the first field in order that has an error", () => {
    expect(firstInvalidField({ password: "a", email: "b" }, order)).toBe("email");
    expect(firstInvalidField({ password: "a" }, order)).toBe("password");
    expect(firstInvalidField({}, order)).toBeUndefined();
  });
});
