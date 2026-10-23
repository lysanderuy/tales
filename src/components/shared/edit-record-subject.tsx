"use client";

import { useCallback, useEffect, useState } from "react";

import { Picker } from "@/components/shared/picker";
import { SubjectTrigger } from "@/components/shared/subject-trigger";
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
      <SubjectTrigger
        triggerRef={setButton}
        open={open}
        onToggle={() => setOpen((value) => !value)}
        name={nodeId ? (subject?.name ?? messages.todayUnknownSubject) : null}
        path={path}
        placeholder={messages.todayWhatStudied}
      />
      {open ? (
        <Picker anchor={button} selected={{ nodeId, blockId }} onPick={onPick} onClose={close} />
      ) : null}
    </>
  );
}
