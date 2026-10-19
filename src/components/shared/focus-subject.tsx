"use client";

import { useCallback, useState } from "react";

import { Picker } from "@/components/shared/picker";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { formatPath, type SubjectInfo } from "@/lib/today/subject-index";
import type { SessionResponse } from "@/validators/study-session.validator";

type FocusSubjectProps = {
  session: Pick<SessionResponse, "nodeId" | "blockId">;
  subject: SubjectInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (nodeId: string, blockId: string | null) => void;
};

export function FocusSubject({ session, subject, open, onOpenChange, onPick }: FocusSubjectProps) {
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const hasSubject = session.nodeId !== null;

  return (
    <>
      {hasSubject ? <Eyebrow as="div">{messages.focusFocusingOn}</Eyebrow> : null}
      <button
        ref={setButton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="group mx-auto block rounded-row px-2.5 py-1 text-center"
      >
        <span
          className={cn(
            "block text-name tracking-[-0.01em] underline decoration-1 underline-offset-[5px]",
            hasSubject
              ? "font-semibold decoration-transparent group-hover:decoration-border"
              : "font-medium text-text-faint decoration-text-faint/55 group-hover:decoration-text-faint",
          )}
        >
          {hasSubject ? (subject?.name ?? "�") : messages.todayWhatStudying}
        </span>
        {subject && subject.ancestors.length > 0 ? (
          <span className="mt-0.5 block text-caption text-text-faint">
            {formatPath(subject.ancestors)}
          </span>
        ) : null}
      </button>
      {open ? (
        <Picker
          anchor={button}
          selected={{ nodeId: session.nodeId, blockId: session.blockId }}
          onPick={onPick}
          onClose={close}
        />
      ) : null}
    </>
  );
}
