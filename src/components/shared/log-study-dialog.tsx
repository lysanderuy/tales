"use client";

import { DialogShell } from "@/components/shared/dialog-shell";
import { LogStudyForm } from "@/components/shared/log-study-form";
import type { PlanLookup } from "@/components/shared/plan-row";
import { messages } from "@/lib/messages";

type LogStudyDialogProps = {
  defaultDate: string;
  today: string;
  timeZone: string;
  lookup: PlanLookup;
  opener: HTMLElement | null;
  onClose: () => void;
};

export function LogStudyDialog({
  defaultDate,
  today,
  timeZone,
  lookup,
  opener,
  onClose,
}: LogStudyDialogProps) {
  return (
    <DialogShell label={messages.logTitle} opener={opener} onClose={onClose}>
      {(onOverlayChange) => (
        <LogStudyForm
          defaultDate={defaultDate}
          today={today}
          timeZone={timeZone}
          lookup={lookup}
          onClose={onClose}
          onOverlayChange={onOverlayChange}
        />
      )}
    </DialogShell>
  );
}
