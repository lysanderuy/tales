import { create } from "zustand";

interface UiState {
  focusOpen: boolean;
  setFocusOpen: (open: boolean) => void;
  staleHandledId: string | null;
  setStaleHandledId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  focusOpen: false,
  setFocusOpen: (open) => set({ focusOpen: open }),
  staleHandledId: null,
  setStaleHandledId: (id) => set({ staleHandledId: id }),
}));
