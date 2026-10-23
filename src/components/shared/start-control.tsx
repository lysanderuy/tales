"use client";

import { useCallback, useRef, useState } from "react";

import { CountdownOptions, parseCustomMinutes } from "@/components/shared/countdown-options";
import { ChevronDownIcon, PlayIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { useOpenFocus } from "@/hooks/use-open-focus";
import { useStartSession } from "@/hooks/use-start-session";
import { messages } from "@/lib/messages";
import { unlockAudio } from "@/lib/sound/chime";

export function StartControl() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const start = useStartSession();
  const openFocus = useOpenFocus();

  const startWith = (plannedMinutes?: number) => {
    setOpen(false);
    unlockAudio();
    start.mutate({ startedFrom: "free", plannedMinutes }, { onSuccess: openFocus });
  };

  const startFromButton = () => {
    const typed = customRef.current?.value ?? "";
    if (typed === "") return startWith();
    const minutes = parseCustomMinutes(typed);
    if (minutes === null) return customRef.current?.focus();
    startWith(minutes);
  };

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, chevronRef, open, close);

  return (
    <div ref={containerRef} className="relative flex">
      <button
        type="button"
        disabled={start.isPending}
        onClick={startFromButton}
        className="press inline-flex items-center gap-2 rounded-l-full bg-primary py-2.5 pl-[18px] pr-3.5 text-ui font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
      >
        <PlayIcon />
        {messages.todayStart}
      </button>
      <button
        ref={chevronRef}
        type="button"
        title={messages.todayStartCountdown}
        aria-label={messages.todayStartCountdown}
        aria-haspopup="true"
        aria-expanded={open}
        disabled={start.isPending}
        onClick={() => setOpen((value) => !value)}
        className="press inline-flex items-center rounded-r-full border-l border-on-primary/30 bg-primary py-2.5 pl-2.5 pr-3 text-on-primary hover:opacity-90 disabled:opacity-50"
      >
        <ChevronDownIcon />
      </button>
      {open ? (
        <div className="absolute right-0 top-[52px] z-[6] w-[220px] rounded-field border border-border bg-surface p-1.5">
          <CountdownOptions inputRef={customRef} disabled={start.isPending} onSelect={startWith} />
        </div>
      ) : null}
    </div>
  );
}
