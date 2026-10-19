"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { useToastStore } from "@/stores/toast.store";

export function Toast() {
  const message = useToastStore((state) => state.message);
  const [text, setText] = useState("");

  if (message && message !== text) setText(message);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed bottom-7 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-hero px-5 py-3 text-ui text-on-hero transition-opacity duration-[var(--dur-slow)]",
        message ? "opacity-100" : "opacity-0",
      )}
    >
      {text}
    </div>
  );
}
