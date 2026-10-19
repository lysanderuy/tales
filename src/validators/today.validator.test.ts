import { describe, expect, it } from "vitest";

import { nextUpQuerySchema, pickerQuerySchema } from "./today.validator";

const id = "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90";

describe("nextUpQuerySchema", () => {
  it("accepts no exclusion", () => {
    expect(nextUpQuerySchema.parse({})).toEqual({});
  });
  it("accepts a planned item ID", () => {
    expect(nextUpQuerySchema.parse({ excludeBlockId: id })).toEqual({ excludeBlockId: id });
  });
  it("rejects a bad ID", () => {
    expect(nextUpQuerySchema.safeParse({ excludeBlockId: "nope" }).success).toBe(false);
  });
});

describe("pickerQuerySchema", () => {
  it("treats empty search text as no search", () => {
    expect(pickerQuerySchema.parse({ q: "   " }).q).toBeUndefined();
    expect(pickerQuerySchema.parse({}).q).toBeUndefined();
  });
  it("trims search text", () => {
    expect(pickerQuerySchema.parse({ q: " rbc " }).q).toBe("rbc");
  });
  it("rejects very long text", () => {
    expect(pickerQuerySchema.safeParse({ q: "a".repeat(81) }).success).toBe(false);
  });
});
