"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton, type IconButtonVariant } from "@/components/ui/icon-button";

type ToolMenuProps = {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  children: (close: () => void) => ReactNode;
};

export function ToolMenu({ label, icon, variant, children }: ToolMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, triggerRef, open, close);

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        label={label}
        variant={variant}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
      </IconButton>
      {open ? (
        <div
          ref={containerRef}
          data-focus-popover=""
          className="absolute left-1/2 top-[52px] z-[6] w-[220px] -translate-x-1/2 rounded-field border border-border bg-surface p-1.5 text-left"
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
