"use client";

import { useCallback, useEffect, type RefObject } from "react";

export function useDismiss(
  containerRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  useEffect(() => {
    if (!open) return;

    // The trigger counts as inside so its own click toggles instead of close-then-reopen.
    function onOutside(event: Event) {
      const target = event.target;
      if (
        target instanceof Node &&
        !containerRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        onClose();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeAndRestoreFocus();
    }

    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [containerRef, triggerRef, open, onClose, closeAndRestoreFocus]);

  return closeAndRestoreFocus;
}
