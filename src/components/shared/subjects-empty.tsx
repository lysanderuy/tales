"use client";

import { ImportIcon, PlusIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";

export function SubjectsEmpty({ onAdd }: { onAdd: () => void }) {
  const showToast = useToastStore((state) => state.show);

  return (
    <div className="px-0 pb-10 pt-12 text-center">
      <p className="mb-5 py-1 text-ui text-text-faint">{messages.subjectsEmpty}</p>
      <div className="flex items-center justify-center gap-3">
        <IconButton variant="solid" label={messages.subjectsAddSubject} onClick={onAdd}>
          <PlusIcon />
        </IconButton>
        <IconButton
          label={messages.subjectsImport}
          onClick={() => showToast(messages.subjectsImportSoon)}
        >
          <ImportIcon />
        </IconButton>
      </div>
    </div>
  );
}
