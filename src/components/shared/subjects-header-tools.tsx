"use client";

import { useCallback, useRef, useState } from "react";

import { MoreIcon, PlusIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";

type SubjectsHeaderToolsProps = {
  addLabel: string;
  onAdd: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
};

const itemClass = "flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill";

export function SubjectsHeaderTools({
  addLabel,
  onAdd,
  showArchived,
  onToggleArchived,
}: SubjectsHeaderToolsProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, triggerRef, open, close);
  const showToast = useToastStore((state) => state.show);

  const items = [
    {
      label: showArchived ? messages.subjectsHideArchived : messages.subjectsShowArchived,
      run: onToggleArchived,
    },
    { label: messages.subjectsImport, run: () => showToast(messages.subjectsImportSoon) },
    { label: messages.subjectsExport, run: () => showToast(messages.subjectsExportSoon) },
  ];

  return (
    <div className="flex gap-2">
      <IconButton size="xs" variant="tint" label={addLabel} onClick={onAdd}>
        <PlusIcon size={18} />
      </IconButton>
      <div className="relative">
        <IconButton
          ref={triggerRef}
          size="xs"
          label={messages.subjectsMore}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreIcon />
        </IconButton>
        {open ? (
          <div
            ref={containerRef}
            className="absolute right-0 top-[42px] z-[6] w-60 rounded-field border border-border bg-surface p-2"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={itemClass}
                onClick={() => {
                  close();
                  item.run();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
