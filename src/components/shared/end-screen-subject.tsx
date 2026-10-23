"use client";

import { forwardRef, useCallback, useState } from "react";

import { Picker } from "@/components/shared/picker";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { formatPath, type SubjectInfo } from "@/lib/today/subject-index";

type EndScreenSubjectProps = {
  nodeId: string | null;
  blockId: string | null;
  subject: SubjectInfo | null;
  onPick: (nodeId: string, blockId: string | null) => void;
};

export const EndScreenSubject = forwardRef<HTMLButtonElement, EndScreenSubjectProps>(
  function EndScreenSubject({ nodeId, blockId, subject, onPick }, ref) {
    const [open, setOpen] = useState(false);
    const [button, setButton] = useState<HTMLButtonElement | null>(null);
    const close = useCallback(() => setOpen(false), []);
    const hasSubject = nodeId !== null;

    return (
      <>
        <button
          ref={(node) => {
            setButton(node);
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
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
            {hasSubject
              ? (subject?.name ?? messages.todayUnknownSubject)
              : messages.todayWhatStudied}
          </span>
          {subject && subject.ancestors.length > 0 ? (
            <span className="mt-0.5 block text-caption text-text-faint">
              {formatPath(subject.ancestors)}
            </span>
          ) : null}
        </button>
        {open ? (
          <Picker anchor={button} selected={{ nodeId, blockId }} onPick={onPick} onClose={close} />
        ) : null}
      </>
    );
  },
);
