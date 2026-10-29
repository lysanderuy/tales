"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { buttonClass } from "@/components/ui/button";
import { TimeField } from "@/components/shared/time-field";
import { useCurrentSession, useStaleSession } from "@/hooks/use-current-session";
import { useProfile } from "@/hooks/use-profile";
import { useHeartbeatSession } from "@/hooks/use-heartbeat-session";
import { useStopSession } from "@/hooks/use-stop-session";
import { useSubjects } from "@/hooks/use-subjects";
import { messages } from "@/lib/messages";
import { formatClock } from "@/lib/time/zone";
import { clockOffset } from "@/lib/timer/clock";
import { staleClockLabel, staleDayLabel, staleStopInstant } from "@/lib/timer/stale-stop";
import { buildSubjectIndex } from "@/lib/today/subject-index";
import { useToastStore } from "@/stores/toast.store";
import { useUiStore } from "@/stores/ui.store";
import type { SessionResponse } from "@/validators/study-session.validator";

type Step = "choose" | "time";

function StalePromptDialog({ session }: { session: SessionResponse }) {
  const { data, dataUpdatedAt } = useCurrentSession();
  const setHandled = useUiStore((state) => state.setStaleHandledId);
  const showError = useToastStore((state) => state.showError);
  const heartbeat = useHeartbeatSession();
  const stop = useStopSession();
  const [step, setStep] = useState<Step>("choose");
  const [editedTime, setEditedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stillRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<HTMLButtonElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const cameBack = useRef(false);
  const subjects = useSubjects();
  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);
  const [openedAt] = useState(() => new Date());
  const heartbeatAt = new Date(session.lastHeartbeatAt);
  const subjectName = session.nodeId ? (index.get(session.nodeId)?.name ?? null) : null;
  const timeZone = useProfile().data?.timeZone ?? null;
  const time = editedTime ?? (timeZone ? formatClock(heartbeatAt, timeZone) : "");
  const heartbeatDay = timeZone ? staleDayLabel(heartbeatAt, openedAt, timeZone) : null;
  const busy = heartbeat.isPending || stop.isPending;

  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (step === "time") timeRef.current?.focus();
    else if (cameBack.current) stopRef.current?.focus();
  }, [step]);

  // A choice is required: Esc must not reach Focus mode behind, and Tab must stay inside.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const dialog = dialogRef.current;
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)"),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!dialog.contains(active) || (event.shiftKey && (active === first || active === dialog))) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const onStillStudying = () =>
    heartbeat.mutate(session.id, {
      onSuccess: () => setHandled(session.id),
      onError: showError,
    });

  const onSave = () => {
    if (!timeZone) return;
    if (time === "") {
      setError(messages.timeInvalid);
      return;
    }
    const serverNow = data ? Date.now() + clockOffset(data.serverNow, dataUpdatedAt) : Date.now();
    const endedAt = staleStopInstant(
      time,
      new Date(session.lastHeartbeatAt),
      new Date(session.startedAt),
      new Date(serverNow),
      timeZone,
    );
    if (!endedAt) {
      setError(messages.stopTimeOutOfRange);
      return;
    }
    setError(null);
    stop.mutate(
      { id: session.id, endedAt: endedAt.toISOString() },
      { onSuccess: () => setHandled(session.id) },
    );
  };

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-[var(--scrim)] p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stale-prompt-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-[var(--dialog-w)] overflow-auto rounded-card border border-border bg-surface p-6 outline-none"
      >
        <h2 id="stale-prompt-title" className="text-h2 font-semibold tracking-[-0.01em]">
          {messages.staleTitle}
        </h2>
        <p className="mt-2 text-small text-text-soft">
          {subjectName ? <span className="block">{subjectName}</span> : null}
          {timeZone ? (
            <span className="num block">
              {messages.staleTimes(
                staleClockLabel(new Date(session.startedAt), openedAt, timeZone),
                staleClockLabel(heartbeatAt, openedAt, timeZone),
              )}
            </span>
          ) : null}
        </p>

        {step === "choose" || !timeZone ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              ref={stillRef}
              type="button"
              disabled={busy}
              onClick={onStillStudying}
              className={buttonClass("primary")}
            >
              {messages.staleStillStudying}
            </button>
            <button
              ref={stopRef}
              type="button"
              disabled={busy || !timeZone}
              onClick={() => {
                cameBack.current = false;
                setStep("time");
              }}
              className={buttonClass("fill")}
            >
              {messages.staleStopAtTime}
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <TimeField
                inputRef={timeRef}
                label={messages.staleStopAt}
                defaultValue={time}
                disabled={busy}
                onChange={(value) => {
                  setEditedTime(value);
                  setError(null);
                }}
              />
              {heartbeatDay ? (
                <p className="num mt-2 text-small text-text-soft">{heartbeatDay}</p>
              ) : null}
            </div>
            <p role="alert" className="mt-2 min-h-5 text-ui text-danger">
              {error}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  cameBack.current = true;
                  setStep("choose");
                }}
                className={buttonClass("fill")}
              >
                {messages.staleBack}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onSave}
                className={buttonClass("primary")}
              >
                {messages.staleSave}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function StalePrompt() {
  const session = useStaleSession();
  if (!session) return null;
  return <StalePromptDialog key={session.id} session={session} />;
}
