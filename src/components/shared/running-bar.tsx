"use client";

import { PauseIcon, PlayIcon, StopIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { usePauseSession } from "@/hooks/use-pause-session";
import { useResumeSession } from "@/hooks/use-resume-session";
import { useStopSession } from "@/hooks/use-stop-session";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import type { ClockDisplay } from "@/lib/timer/clock";
import { useUiStore } from "@/stores/ui.store";
import type { SessionResponse } from "@/validators/study-session.validator";

type RunningBarProps = {
  session: SessionResponse;
  display: ClockDisplay;
  subjectName: string | null;
};

export function RunningBar({ session, display, subjectName }: RunningBarProps) {
  const setFocusOpen = useUiStore((state) => state.setFocusOpen);
  const pause = usePauseSession();
  const resume = useResumeSession();
  const stop = useStopSession();
  const busy = pause.isPending || resume.isPending || stop.isPending;

  return (
    <div className="flex max-w-[460px] items-center gap-2 rounded-full border border-border bg-surface py-[5px] pl-3.5 pr-[5px]">
      <button
        type="button"
        title={messages.timerOpenFocus}
        aria-label={messages.timerOpenFocus}
        onClick={() => setFocusOpen(true)}
        className="flex items-center gap-2 rounded-full py-1"
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-[7px] shrink-0 rounded-full",
            display.paused ? "bg-text-faint" : "bg-primary",
          )}
        />
        <span
          className={cn(
            "num min-w-[52px] text-left text-name font-semibold tracking-[-0.01em] transition-colors duration-[var(--dur-slow)]",
            display.paused ? "text-text-faint" : display.over ? "text-overtime" : "text-time",
          )}
        >
          {display.text}
        </span>
      </button>
      <span className="max-w-[190px] truncate rounded-row px-1.5 py-1 text-small text-text-soft">
        {subjectName ?? messages.todayWhatStudying}
      </span>
      {display.paused ? (
        <IconButton
          size="xs"
          label={messages.timerResume}
          disabled={busy}
          onClick={() => resume.mutate(session.id)}
        >
          <PlayIcon size={14} />
        </IconButton>
      ) : (
        <IconButton
          size="xs"
          label={messages.timerPause}
          disabled={busy}
          onClick={() => pause.mutate(session.id)}
        >
          <PauseIcon />
        </IconButton>
      )}
      <IconButton
        size="xs"
        label={messages.timerStop}
        disabled={busy}
        onClick={() => stop.mutate({ id: session.id })}
      >
        <StopIcon />
      </IconButton>
    </div>
  );
}
