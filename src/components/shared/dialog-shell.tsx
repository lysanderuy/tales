"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DialogShellProps = {
  label: string;
  opener: HTMLElement | null;
  onClose: () => void;
  children: (onOverlayChange: (open: boolean) => void) => ReactNode;
};

const FOCUSABLE = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled):not([type=hidden])",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
].join(", ");

export function DialogShell({ label, opener, onClose, children }: DialogShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [overlayOpen, onOverlayChange] = useState(false);

  useEffect(() => {
    overlayOpenRef.current = overlayOpen;
  }, [overlayOpen]);

  useEffect(() => {
    const returnTo = opener ?? document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (returnTo instanceof HTMLElement && returnTo.isConnected) returnTo.focus();
    };
  }, [opener]);

  // Capture phase runs before the Picker and delete popover handlers, so overlayOpenRef still
  // says whether one of them is about to consume Esc.
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
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.getClientRects().length > 0,
      );
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
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-[var(--scrim)] p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-[var(--dialog-w)] overflow-auto rounded-card border border-border bg-surface p-6 pt-0 outline-none"
      >
        {children(onOverlayChange)}
      </div>
    </div>
  );
}
