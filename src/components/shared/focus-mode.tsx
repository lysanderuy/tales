"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FocusSubject } from "@/components/shared/focus-subject";
import { FocusTools } from "@/components/shared/focus-tools";
import {
  CollapseIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  VolumeOffIcon,
  VolumeOnIcon,
} from "@/components/shared/icons";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { usePauseSession } from "@/hooks/use-pause-session";
import { usePickSubject } from "@/hooks/use-pick-subject";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useResumeSession } from "@/hooks/use-resume-session";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useSessionNote } from "@/hooks/use-session-note";
import { useStopSession } from "@/hooks/use-stop-session";
import { useSubjects } from "@/hooks/use-subjects";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { unlockAudio } from "@/lib/sound/chime";
import { formatClock, type ClockDisplay } from "@/lib/timer/clock";
import { buildSubjectIndex, resolveSubject } from "@/lib/today/subject-index";
import { useUiStore } from "@/stores/ui.store";
import type { SessionResponse } from "@/validators/study-session.validator";

const NOTE_MAX_LENGTH = 5000;

function ignore(): void {}

type FocusDialogProps = {
  session: SessionResponse;
  display: ClockDisplay;
};

function FocusDialog({ session, display }: FocusDialogProps) {
  const setFocusOpen = useUiStore((state) => state.setFocusOpen);
  const pause = usePauseSession();
  const resume = useResumeSession();
  const stop = useStopSession();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const pickSubject = usePickSubject(session.id);
  const note = useSessionNote(session.id, session.note);
  const subjects = useSubjects();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const pauseRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);
  const subject = session.nodeId
    ? subjects.isSuccess
      ? resolveSubject(index, session.nodeId, messages.todayUnknownSubject)
      : (index.get(session.nodeId) ?? null)
    : null;

  const savedSound = profile.data?.soundOn ?? true;
  const soundOn = updateProfile.isPending
    ? (updateProfile.variables.soundOn ?? savedSound)
    : savedSound;
  const busy = pause.isPending || resume.isPending || stop.isPending;
  const paused = display.paused;

  useEffect(() => {
    const opener = document.activeElement;
    pauseRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    // Capture phase runs before the Picker and tool menus close themselves on the same keypress.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.isComposing) return;
      if (document.querySelector("[data-focus-popover], [data-picker-scope]")) return;
      setFocusOpen(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [setFocusOpen]);

  useEffect(() => {
    if (noteOpen) noteRef.current?.focus();
  }, [noteOpen]);

  const toggleNote = () => {
    if (noteOpen) note.flush().catch(ignore);
    setNoteOpen((value) => !value);
  };

  const onStop = async () => {
    try {
      await note.flush();
      await stop.mutateAsync({ id: session.id });
      setFocusOpen(false);
    } catch {
      // The failing mutation has already shown its error.
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={messages.focusLabel}
      onClickCapture={unlockAudio}
      className="fixed inset-0 z-[var(--z-focus)] flex flex-col items-center overflow-hidden bg-bg px-6 py-14 text-center"
    >
      <div className="absolute left-6 top-6">
        <IconButton size="sm" label={messages.focusMinimize} onClick={() => setFocusOpen(false)}>
          <CollapseIcon />
        </IconButton>
      </div>
      <div className="absolute right-6 top-6">
        <IconButton
          size="sm"
          label={soundOn ? messages.focusSoundOn : messages.focusSoundOff}
          onClick={() => updateProfile.mutate({ soundOn: !soundOn })}
        >
          {soundOn ? <VolumeOnIcon /> : <VolumeOffIcon />}
        </IconButton>
      </div>

      <div
        className={cn(
          "relative m-auto transition-opacity duration-[var(--dur-base)]",
          pickerOpen && "opacity-25",
        )}
      >
        <FocusSubject
          session={session}
          subject={subject}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={pickSubject}
        />
        <div
          role="timer"
          className={cn(
            "num mb-2 mt-6 text-timer font-normal leading-none tracking-[-0.03em] transition-colors duration-[var(--dur-slow)]",
            paused ? "text-text-faint" : display.over ? "text-overtime" : "text-time",
          )}
        >
          {display.text}
        </div>
        <Eyebrow as="div" className="num h-5">
          {session.plannedMinutes !== null
            ? `${messages.focusPlanned} ${formatClock(session.plannedMinutes * 60)}`
            : null}
        </Eyebrow>
        <div className="mt-10 flex justify-center gap-10">
          <IconButton
            size="lg"
            label={messages.timerStop}
            disabled={busy}
            onClick={() => void onStop()}
          >
            <StopIcon size={28} />
          </IconButton>
          <IconButton
            ref={pauseRef}
            size="lg"
            variant="solid"
            label={paused ? messages.timerResume : messages.timerPause}
            disabled={busy}
            onClick={() => (paused ? resume.mutate(session.id) : pause.mutate(session.id))}
          >
            {paused ? <PlayIcon size={28} /> : <PauseIcon size={28} />}
          </IconButton>
        </div>
        <FocusTools
          session={session}
          display={display}
          hasNote={note.text.trim() !== ""}
          noteOpen={noteOpen}
          onToggleNote={toggleNote}
        />
        {noteOpen ? (
          <div className="absolute left-1/2 top-full w-[min(440px,92vw)] -translate-x-1/2 pt-5">
            <textarea
              ref={noteRef}
              value={note.text}
              maxLength={NOTE_MAX_LENGTH}
              placeholder={messages.focusNotePlaceholder}
              aria-label={messages.focusNote}
              onChange={(event) => note.setText(event.target.value)}
              onBlur={() => note.flush().catch(ignore)}
              className="block min-h-24 w-full resize-none rounded-field bg-fill px-3.5 py-3 text-left text-ui text-text placeholder:text-text-faint"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FocusMode() {
  const focusOpen = useUiStore((state) => state.focusOpen);
  const setFocusOpen = useUiStore((state) => state.setFocusOpen);
  const { session, display } = useSessionClock();
  const live = session !== null && display !== null;

  useEffect(() => {
    if (focusOpen && !live) setFocusOpen(false);
  }, [focusOpen, live, setFocusOpen]);

  if (!focusOpen || !session || !display) return null;
  return <FocusDialog key={session.id} session={session} display={display} />;
}
