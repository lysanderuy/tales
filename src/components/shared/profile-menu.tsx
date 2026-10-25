"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { Avatar } from "@/components/shared/settings-avatar";
import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton } from "@/components/ui/icon-button";
import { useProfile } from "@/hooks/use-profile";
import { messages } from "@/lib/messages";

const itemClass = "flex w-full items-center rounded-row px-2.5 py-2.5 text-left text-ui";

export function ProfileMenu() {
  const profile = useProfile().data;
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
        variant="tint"
        className="overflow-hidden"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar
          url={profile?.avatarUrl ?? null}
          name={profile?.displayName ?? ""}
          className="size-full text-small"
        />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 w-60 rounded-field border border-border bg-surface p-1.5">
          <Link href="/settings" className={`${itemClass} hover:bg-fill`} onClick={close}>
            {messages.profileSettings}
          </Link>
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
