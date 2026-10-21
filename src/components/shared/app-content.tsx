"use client";

import { useEndRecord, useStaleSession } from "@/hooks/use-current-session";
import { useUiStore } from "@/stores/ui.store";

export function AppContent({ children }: { children: React.ReactNode }) {
  const focusOpen = useUiStore((state) => state.focusOpen);
  const endOpen = useEndRecord() !== null;
  const staleOpen = useStaleSession() !== null;

  return (
    <div inert={focusOpen || endOpen || staleOpen} className="flex min-h-screen flex-col">
      {children}
    </div>
  );
}
