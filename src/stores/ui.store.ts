import { create } from "zustand";

import type { SessionResponse } from "@/validators/study-session.validator";

interface UiState {
  focusOpen: boolean;
  setFocusOpen: (open: boolean) => void;
  justStopped: SessionResponse | null;
  staleHandledId: string | null;
  setStaleHandledId: (id: string | null) => void;
  setJustStopped: (session: SessionResponse | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  focusOpen: false,
  setFocusOpen: (open) => set({ focusOpen: open }),
  justStopped: null,
  setJustStopped: (session) => set({ justStopped: session }),
  staleHandledId: null,
  setStaleHandledId: (id) => set({ staleHandledId: id }),
}));
