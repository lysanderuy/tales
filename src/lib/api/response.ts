import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { messages } from "@/lib/messages";
import type { ApiResponse } from "@/types/api";

export class AppError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error }, { status });
}

function dbErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return code;
  return dbErrorCode((error as { cause?: unknown }).cause);
}

export function mapDbError(error: unknown): AppError | undefined {
  switch (dbErrorCode(error)) {
    case "23505":
      return new AppError(409, messages.conflictDuplicate);
    case "23P01":
      return new AppError(409, messages.conflictOverlap);
    case "23503":
      return new AppError(409, messages.conflictReference);
    case "23514":
      return new AppError(422, messages.invalidValue);
    default:
      return undefined;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) return apiError(error.message, error.status);

  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return apiError(message, 422);
  }

  if (error instanceof SyntaxError) return apiError(messages.invalidRequest, 400);

  const mapped = mapDbError(error);
  if (mapped) return apiError(mapped.message, mapped.status);

  console.error("[api]", error);
  return apiError("Internal server error", 500);
}
