"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDismiss } from "@/components/shared/use-dismiss";
import { messages } from "@/lib/messages";

type EndScreenDiscardProps = {
  disabled: boolean;
  onDiscard: () => void;
  label?: string;
  confirmLabel?: string;
  keepLabel?: string;
  onOpenChange?: (open: boolean) => void;
};

const itemClass = "flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill";

export function EndScreenDiscard({
  disabled,
  onDiscard,
  label = messages.endDiscard,
  confirmLabel = messages.endDiscardThis,
  keepLabel = messages.endKeep,
  onOpenChange,
}: EndScreenDiscardProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const onClose = useCallback(() => setOpen(false), []);
  const close = useDismiss(containerRef, triggerRef, open, onClose);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="press rounded-row px-3 py-2 text-ui text-text-faint hover:bg-fill disabled:opacity-50"
      >
        {label}
      </button>
      {open ? (
        <div
          ref={containerRef}
          className="absolute bottom-full left-0 z-[6] mb-1.5 w-[220px] rounded-field border border-border bg-surface p-1.5 text-left"
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onDiscard();
            }}
            className={itemClass}
          >
            {confirmLabel}
          </button>
          <button type="button" onClick={close} className={itemClass}>
            {keepLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
