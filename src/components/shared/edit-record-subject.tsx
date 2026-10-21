"use client";

import { useCallback, useEffect, useState } from "react";

import { Picker } from "@/components/shared/picker";
import { Swatch } from "@/components/ui/swatch";
import { messages } from "@/lib/messages";
import { formatPath, type SubjectInfo } from "@/lib/today/subject-index";

type EditRecordSubjectProps = {
  nodeId: string | null;
  blockId: string | null;
  subject: SubjectInfo | null;
  onPick: (nodeId: string, blockId: string | null) => void;
  onOpenChange: (open: boolean) => void;
};

export function EditRecordSubject({
  nodeId,
  blockId,
  subject,
  onPick,
  onOpenChange,
}: EditRecordSubjectProps) {
  const [open, setOpen] = useState(false);
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const path = subject ? formatPath(subject.ancestors) : "";

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={setButton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[52px] w-full items-center gap-2.5 rounded-field bg-fill px-3.5 py-3 text-left hover:bg-fill-hover"
      >
        <Swatch color={subject?.color ?? "var(--border)"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body font-semibold">
            {nodeId ? (subject?.name ?? messages.todayUnknownSubject) : messages.todayWhatStudying}
          </span>
          {path ? (
            <span className="block truncate text-caption text-text-faint">{path}</span>
          ) : null}
        </span>
      </button>
      {open ? (
        <Picker anchor={button} selected={{ nodeId, blockId }} onPick={onPick} onClose={close} />
      ) : null}
    </>
  );
}
