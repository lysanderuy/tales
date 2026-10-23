import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

const USER_FACING_STATUSES = new Set([400, 404, 409, 422]);

export function failureText(error: unknown): string {
  return error instanceof ApiError && USER_FACING_STATUSES.has(error.status)
    ? error.message
    : messages.serverError;
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <Eyebrow as="div" className="mb-2">
        {label}
      </Eyebrow>
      {children}
    </div>
  );
}
