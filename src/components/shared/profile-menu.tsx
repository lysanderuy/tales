"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UserIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";

const itemClass = "flex w-full items-center rounded-row px-2.5 py-2.5 text-left text-ui";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, triggerRef, open, close);

  useEffect(() => {
    if (open) signOutRef.current?.focus();
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        ref={triggerRef}
        label={messages.profileLabel}
        size="sm"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <UserIcon />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-60 rounded-field border border-border bg-surface p-1.5">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`${itemClass} cursor-not-allowed text-text-faint`}
          >
            {messages.profileSettings}
          </button>
          <form action="/api/auth/logout" method="post">
            <button ref={signOutRef} type="submit" className={`${itemClass} hover:bg-fill`}>
              {messages.profileSignOut}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
