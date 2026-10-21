"use client";

import { useEndRecord } from "@/hooks/use-current-session";
import { useUiStore } from "@/stores/ui.store";

export function AppContent({ children }: { children: React.ReactNode }) {
  const focusOpen = useUiStore((state) => state.focusOpen);
  const endOpen = useEndRecord() !== null;

  return (
    <div inert={focusOpen || endOpen} className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
