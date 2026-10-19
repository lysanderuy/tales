"use client";

import { useUiStore } from "@/stores/ui.store";

export function AppContent({ children }: { children: React.ReactNode }) {
  const focusOpen = useUiStore((state) => state.focusOpen);

  return (
    <div inert={focusOpen} className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
