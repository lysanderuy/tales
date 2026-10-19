"use client";

import { useCallback } from "react";

import { useUiStore } from "@/stores/ui.store";
import type { SessionResponse } from "@/validators/study-session.validator";

export function useOpenFocus(): (session: SessionResponse) => void {
  const setFocusOpen = useUiStore((state) => state.setFocusOpen);
  return useCallback(
    (session) => {
      if (session.state !== "stopped") setFocusOpen(true);
    },
    [setFocusOpen],
  );
}
