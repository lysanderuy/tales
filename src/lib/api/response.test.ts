import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";

import { messages } from "@/lib/messages";

import { apiError, apiSuccess, AppError, handleApiError, mapDbError } from "./response";

describe("apiSuccess", () => {
  it("wraps data in the success envelope", async () => {
    const response = apiSuccess({ id: "1" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: { id: "1" } });
  });

  it("respects a custom status code", () => {
    const response = apiSuccess({ id: "1" }, 201);
    expect(response.status).toBe(201);
  });
});

describe("apiError", () => {
  it("wraps a message in the error envelope with a 400 default", async () => {
    const response = apiError("bad request");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ success: false, error: "bad request" });
  });
});

describe("handleApiError", () => {
  it("formats ZodError issues into a 422 response", async () => {
    const schema = z.object({ displayName: z.string().min(1) });
    const result = schema.safeParse({ displayName: "" });
    const error = result.success ? undefined : new ZodError(result.error.issues);

    const response = handleApiError(error);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("displayName");
  });

  it("uses the status and message of an AppError", async () => {
    const response = handleApiError(new AppError(401, "Nope"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ success: false, error: "Nope" });
  });

  it("maps a unique violation to a 409", async () => {
    const response = handleApiError(Object.assign(new Error("dup"), { code: "23505" }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: messages.conflictDuplicate,
    });
  });

  it("maps malformed JSON to a 400", async () => {
    const error = await new Request("http://localhost", { method: "POST", body: "{" })
      .json()
      .catch((caught: unknown) => caught);

    const response = handleApiError(error);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: messages.invalidRequest,
    });
  });

  it("falls back to a 500 for unknown errors", async () => {
    const response = handleApiError(new Error("boom"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Internal server error",
    });
  });
});

describe("mapDbError", () => {
  const withCode = (code: string) => Object.assign(new Error("db"), { code });

  it.each([
    ["23505", 409, messages.conflictDuplicate],
    ["23P01", 409, messages.conflictOverlap],
    ["23503", 409, messages.conflictReference],
    ["23514", 422, messages.invalidValue],
  ])("maps %s", (code, status, message) => {
    const mapped = mapDbError(withCode(code));
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped?.status).toBe(status);
    expect(mapped?.message).toBe(message);
  });

  it("finds the code on a wrapped cause", () => {
    const wrapped = new Error("query failed", { cause: withCode("23505") });
    expect(mapDbError(wrapped)?.status).toBe(409);
  });

  it("returns undefined for other errors", () => {
    expect(mapDbError(withCode("42P01"))).toBeUndefined();
    expect(mapDbError(new Error("boom"))).toBeUndefined();
    expect(mapDbError("nope")).toBeUndefined();
  });
});
