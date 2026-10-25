"use client";

import { useCallback, useRef, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/shared/icons";
import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

export type PlanViewMode = "day" | "week";

type PlanControlsProps = {
  title: string;
  mode: PlanViewMode;
  onStep: (step: -1 | 1) => void;
  onToday: () => void;
  onMode: (mode: PlanViewMode) => void;
  onPlan: (opener: HTMLElement) => void;
  onLog: (opener: HTMLElement) => void;
};

const itemClass = "flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill";

type AddMenuProps = {
  onPlan: (opener: HTMLElement) => void;
  onLog: (opener: HTMLElement) => void;
  align?: "left" | "right";
};

export function AddMenu({ onPlan, onLog, align = "left" }: AddMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, triggerRef, open, close);

  const items = [
    { label: messages.planPlanStudy, run: onPlan },
    { label: messages.planLogStudy, run: onLog },
  ];

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        size="sm"
        variant="tint"
        label={messages.planAddMenuLabel}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <PlusIcon size={18} />
      </IconButton>
      {open ? (
        <div
          ref={containerRef}
          className={cn(
            "absolute top-[48px] z-[6] w-[200px] rounded-field border border-border bg-surface p-1.5 text-left",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.run(triggerRef.current ?? document.body);
              }}
              className={itemClass}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const modes: { mode: PlanViewMode; label: string }[] = [
  { mode: "day", label: messages.planDay },
  { mode: "week", label: messages.planWeek },
];

export function PlanControls({
  title,
  mode,
  onStep,
  onToday,
  onMode,
  onPlan,
  onLog,
}: PlanControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <IconButton size="sm" label={messages.planPrevious} onClick={() => onStep(-1)}>
          <ChevronLeftIcon size={18} />
        </IconButton>
        <div className="num min-w-[140px] text-center text-h2 font-semibold tracking-[-0.01em]">
          {title}
        </div>
        <IconButton size="sm" label={messages.planNext} onClick={() => onStep(1)}>
          <ChevronRightIcon size={18} />
        </IconButton>
        <button
          type="button"
          onClick={onToday}
          className="press rounded-full bg-fill px-4 py-2 text-ui font-medium text-text-soft hover:bg-fill-hover"
        >
          {messages.planToday}
        </button>
        <AddMenu onPlan={onPlan} onLog={onLog} />
      </div>
      <div
        role="group"
        aria-label={messages.planViewLabel}
        className="inline-flex gap-0.5 rounded-full bg-fill p-[3px]"
      >
        {modes.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={option.mode === mode}
            onClick={() => onMode(option.mode)}
            className={cn(
              "rounded-full px-3.5 py-[7px] text-ui font-medium transition-colors duration-[var(--dur-fast)]",
              option.mode === mode
                ? "bg-primary-soft text-primary"
                : "text-text-soft hover:bg-fill-hover",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
