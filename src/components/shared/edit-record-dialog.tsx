"use client";

import { useCallback, useEffect, useRef } from "react";

import { EditRecordForm } from "@/components/shared/edit-record-form";
import { CloseIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { messages } from "@/lib/messages";

type EditRecordDialogProps = {
  recordId: string;
  opener: HTMLElement | null;
  onClose: () => void;
};

const FOCUSABLE = "button:not(:disabled), input:not(:disabled), textarea:not(:disabled)";

export function EditRecordDialog({ recordId, opener, onClose }: EditRecordDialogProps) {
  const record = useSession(recordId);
  const profile = useProfile();
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const onOverlayChange = useCallback((open: boolean) => {
    overlayOpenRef.current = open;
  }, []);

  useEffect(() => {
    const returnTo = opener ?? document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (returnTo instanceof HTMLElement && returnTo.isConnected) returnTo.focus();
    };
  }, [opener]);

  // Registered before the Picker and the delete popover add their own Esc handlers, so
  // overlayOpenRef still says whether one of them is about to consume this key.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape") {
        if (!overlayOpenRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const active = document.activeElement;
      if (overlayOpenRef.current && !dialog.contains(active)) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (!dialog.contains(active) || (event.shiftKey && (active === first || active === dialog))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const failed = record.isError || profile.isError;

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-[var(--scrim)] p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={messages.editTitle}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-[var(--dialog-w)] overflow-auto rounded-card border border-border bg-surface p-6 pt-0 outline-none"
      >
        {record.data && profile.data ? (
          <EditRecordForm
            record={record.data}
            timeZone={profile.data.timeZone}
            onClose={onClose}
            onOverlayChange={onOverlayChange}
          />
        ) : (
          <div className="pt-6">
            {failed ? (
              <p role="alert" className="text-small text-danger">
                {messages.serverError}
              </p>
            ) : (
              <p className="text-small text-text-faint">{messages.editLoading}</p>
            )}
            <div className="mt-4 flex justify-end">
              <IconButton label={messages.editCancel} onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
