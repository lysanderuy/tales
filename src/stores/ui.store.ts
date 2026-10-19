import { create } from "zustand";

// Example Zustand store — replace/extend per project.
interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  focusOpen: boolean;
  setFocusOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  focusOpen: false,
  setFocusOpen: (open) => set({ focusOpen: open }),
}));
