import type { Ref } from "react";

import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

type SubjectTriggerProps = {
  triggerRef: Ref<HTMLButtonElement>;
  open: boolean;
  onToggle: () => void;
  name: string | null;
  path: string;
  archived?: boolean;
  placeholder?: string;
};

export function SubjectTrigger({
  triggerRef,
  open,
  onToggle,
  name,
  path,
  archived,
  placeholder = messages.todayWhatStudying,
}: SubjectTriggerProps) {
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={onToggle}
      className="group -ml-2.5 block max-w-full rounded-row px-2.5 py-1 text-left"
    >
      <span
        title={name ?? undefined}
        className={cn(
          "block truncate text-name tracking-[-0.01em] underline decoration-1 underline-offset-[5px]",
          name
            ? "font-semibold decoration-transparent group-hover:decoration-border"
            : "font-medium text-text-faint decoration-text-faint/55 group-hover:decoration-text-faint",
          archived && "opacity-60",
        )}
      >
        {name ?? placeholder}
      </span>
      {name && path ? (
        <span title={path} className="mt-0.5 block truncate text-caption text-text-faint">
          {path}
        </span>
      ) : null}
    </button>
  );
}
