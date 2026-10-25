import type { ReactNode } from "react";

import { failureText } from "@/components/shared/form-parts";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";

export const pillClass =
  "press inline-flex items-center gap-2 rounded-full bg-fill px-4 py-2 text-ui font-medium hover:bg-fill-hover disabled:opacity-50";

export const dangerPillClass = `${pillClass} text-danger`;

// A wrong password comes back as 403 with its own friendly message; failureText hides it.
export function accountFailureText(error: unknown): string {
  return error instanceof ApiError && error.status === 403 ? error.message : failureText(error);
}

type SettingsSectionProps = { id: string; title: string; children: ReactNode };

export function SettingsSection({ id, title, children }: SettingsSectionProps) {
  return (
    <Card id={id} className="scroll-mt-24">
      <h2 className="mb-5 text-h2 font-semibold tracking-[-0.01em]">{title}</h2>
      {children}
    </Card>
  );
}

export function SettingsRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[34px] items-center gap-4 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex-1 text-ui font-medium">{title}</div>
      {children}
    </div>
  );
}
