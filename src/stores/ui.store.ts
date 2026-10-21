import { create } from "zustand";

import type { SessionResponse } from "@/validators/study-session.validator";

// Example Zustand store — replace/extend per project.
interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  focusOpen: boolean;
  setFocusOpen: (open: boolean) => void;
  justStopped: SessionResponse | null;
  staleHandledId: string | null;
  setStaleHandledId: (id: string | null) => void;
  setJustStopped: (session: SessionResponse | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  focusOpen: false,
  setFocusOpen: (open) => set({ focusOpen: open }),
  justStopped: null,
  setJustStopped: (session) => set({ justStopped: session }),
  staleHandledId: null,
  setStaleHandledId: (id) => set({ staleHandledId: id }),
}));
