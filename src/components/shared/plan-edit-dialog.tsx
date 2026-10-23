"use client";

import { DialogShell } from "@/components/shared/dialog-shell";
import { PlanEditForm } from "@/components/shared/plan-edit-form";
import type { PlanLookup } from "@/components/shared/plan-row";
import { messages } from "@/lib/messages";
import type { BlockResponse } from "@/validators/block.validator";

type PlanEditDialogProps = {
  block: BlockResponse | null;
  defaultDate: string;
  today: string;
  lookup: PlanLookup;
  opener: HTMLElement | null;
  onClose: () => void;
};

export function PlanEditDialog({
  block,
  defaultDate,
  today,
  lookup,
  opener,
  onClose,
}: PlanEditDialogProps) {
  return (
    <DialogShell
      label={block ? messages.planEditTitle : messages.planAddTitle}
      opener={opener}
      onClose={onClose}
    >
      {(onOverlayChange) => (
        <PlanEditForm
          block={block}
          defaultDate={defaultDate}
          today={today}
          lookup={lookup}
          onClose={onClose}
          onOverlayChange={onOverlayChange}
        />
      )}
    </DialogShell>
  );
}
