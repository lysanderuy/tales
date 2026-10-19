"use client";

import { useCallback, useRef, useState } from "react";

import { ChevronDownIcon, PlayIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { messages } from "@/lib/messages";

const COUNTDOWN_MINUTES = [25, 45, 60] as const;

const inputClass =
  "w-16 rounded-full bg-fill px-2.5 py-2 text-center text-ui text-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StartControl() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  return (
    <div
      ref={containerRef}
      className="relative flex"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) chevronRef.current?.focus();
      }}
    >
      <button
        type="button"
        className="press inline-flex items-center gap-2 rounded-l-full bg-primary py-2.5 pl-[18px] pr-3.5 text-ui font-medium text-on-primary hover:opacity-90"
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
        onClick={() => setOpen((value) => !value)}
        className="press inline-flex items-center rounded-r-full border-l border-on-primary/30 bg-primary py-2.5 pl-2.5 pr-3 text-on-primary hover:opacity-90"
      >
        <ChevronDownIcon />
      </button>
      {open ? (
        <div className="absolute right-0 top-[52px] z-[6] w-[220px] rounded-field border border-border bg-surface p-1.5">
          {COUNTDOWN_MINUTES.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={close}
              className="flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill"
            >
              {minutes} min
            </button>
          ))}
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <label htmlFor="start-custom-minutes" className="flex-1 text-ui text-text-soft">
              {messages.todayCustomMinutes}
            </label>
            <input
              id="start-custom-minutes"
              type="number"
              min={1}
              max={600}
              placeholder={messages.todayCustomMinutesPlaceholder}
              aria-label={messages.todayCustomMinutesLabel}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
