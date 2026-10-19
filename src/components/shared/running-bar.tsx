"use client";

import { useCallback, useState } from "react";

import { PauseIcon, PlayIcon, StopIcon } from "@/components/shared/icons";
import { Picker } from "@/components/shared/picker";
import { IconButton } from "@/components/ui/icon-button";
import { usePauseSession } from "@/hooks/use-pause-session";
import { useResumeSession } from "@/hooks/use-resume-session";
import { useStopSession } from "@/hooks/use-stop-session";
import { useUpdateSession } from "@/hooks/use-update-session";
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
  const update = useUpdateSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nameButton, setNameButton] = useState<HTMLButtonElement | null>(null);
  const closePicker = useCallback(() => setPickerOpen(false), []);
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
      <button
        ref={setNameButton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        onClick={() => setPickerOpen((value) => !value)}
        className="max-w-[190px] truncate rounded-row px-1.5 py-1 text-small text-text-soft hover:bg-fill"
      >
        {subjectName ?? messages.todayWhatStudying}
      </button>
      {pickerOpen ? (
        <Picker
          anchor={nameButton}
          selected={{ nodeId: session.nodeId, blockId: session.blockId }}
          onPick={(nodeId, blockId) =>
            update.mutate(blockId ? { id: session.id, blockId } : { id: session.id, nodeId })
          }
          onClose={closePicker}
        />
      ) : null}
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
