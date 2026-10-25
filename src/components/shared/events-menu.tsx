"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { useDismiss } from "@/components/shared/use-dismiss";

type MenuItem = { label: string; run: () => void };

type TriggerArgs = {
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  toggle: () => void;
};

type EventsMenuProps = {
  items: readonly MenuItem[];
  trigger: (args: TriggerArgs) => ReactNode;
  onOpenChange?: (open: boolean) => void;
};

const itemClass = "flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill";

export function EventsMenu({ items, trigger, onOpenChange }: EventsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, triggerRef, open, close);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div className="relative">
      {trigger({ triggerRef, open, toggle: () => setOpen((value) => !value) })}
      {open ? (
        <div
          ref={containerRef}
          className="absolute right-0 top-full z-[6] mt-2 w-60 rounded-field border border-border bg-surface p-2"
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
  );
}
