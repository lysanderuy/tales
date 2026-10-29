"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { DateField } from "@/components/shared/date-field";
import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { EventsCoverageEdit } from "@/components/shared/events-coverage-edit";
import { Section } from "@/components/shared/form-parts";
import { CloseIcon } from "@/components/shared/icons";
import { TimeField } from "@/components/shared/time-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { coverIdsOf, type CoverageDraft } from "@/lib/events/coverage";
import type { EventMark } from "@/lib/events/marks";
import { messages } from "@/lib/messages";
import type { SubjectIndex } from "@/lib/today/subject-index";

export type EventFormInitial = {
  title: string;
  date: string;
  time: string;
  endTime: string;
  covers: readonly (string | null)[];
  note: string;
  marks: Readonly<Record<string, EventMark>>;
};

export type EventFormValue = {
  title: string;
  date: string;
  time: string | null;
  endTime: string | null;
  coverIds: string[];
  note: string;
  marks: Record<string, EventMark>;
};

type EventsFormProps = {
  initial: EventFormInitial;
  today: string;
  index: SubjectIndex;
  closed: boolean;
  pending: boolean;
  error: string | null;
  focusNote?: boolean;
  onSubmit: (value: EventFormValue) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onOverlayChange?: (open: boolean) => void;
};

const MAX_NOTE_HEIGHT = 280;

export function EventsForm({
  initial,
  today,
  index,
  closed,
  pending,
  error,
  focusNote,
  onSubmit,
  onCancel,
  onDelete,
  onOverlayChange,
}: EventsFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [timeValid, setTimeValid] = useState(true);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [endValid, setEndValid] = useState(true);
  const [endKey, setEndKey] = useState(0);
  const [note, setNote] = useState(initial.note);
  const [coverage, setCoverage] = useState<CoverageDraft>({
    covers: initial.covers,
    marks: initial.marks,
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onOverlayChange?.(dateOpen || coverageOpen || confirmOpen);
  }, [dateOpen, coverageOpen, confirmOpen, onOverlayChange]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (focusNote) noteRef.current?.focus();
      else titleRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusNote]);

  useEffect(() => {
    const area = noteRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight + 2, MAX_NOTE_HEIGHT)}px`;
  }, [note]);

  const endError = time !== "" && endTime === time ? messages.timeEndSameAsStart : undefined;
  const canSave = title.trim() !== "" && timeValid && endValid && !endError && !pending;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    onSubmit({
      title: title.trim(),
      date,
      time: time === "" ? null : time,
      endTime: time === "" || endTime === "" ? null : endTime,
      coverIds: coverIdsOf(coverage.covers),
      note,
      marks: { ...coverage.marks },
    });
  }

  return (
    <form onSubmit={submit}>
      <input
        ref={titleRef}
        type="text"
        value={title}
        maxLength={100}
        placeholder={messages.eventsNamePlaceholder}
        aria-label={messages.eventsNameLabel}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-none border-0 border-b-[1.5px] border-border bg-transparent pb-2 pt-0.5 text-h2 font-semibold tracking-[-0.01em] text-text placeholder:font-normal placeholder:text-text-faint focus:border-primary focus-visible:outline-none"
      />
      <div className="mt-5">
        <DateField
          label={messages.eventsDayLabel}
          value={date}
          onChange={setDate}
          today={today}
          onOpenChange={setDateOpen}
        />
      </div>
      <div className="mt-5">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <TimeField
              label={messages.eventsTimeLabel}
              defaultValue={initial.time}
              onChange={(value, valid) => {
                setTime(value);
                setTimeValid(valid);
                if (valid && value === "") {
                  setEndTime("");
                  setEndValid(true);
                  setEndKey((key) => key + 1);
                }
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <TimeField
              key={endKey}
              label={messages.eventsEndTimeLabel}
              defaultValue={endKey === 0 ? initial.endTime : ""}
              disabled={time === ""}
              error={endError}
              onChange={(value, valid) => {
                setEndTime(value);
                setEndValid(valid);
              }}
            />
          </div>
        </div>
      </div>
      {closed ? (
        <div className="mt-5">
          <textarea
            ref={noteRef}
            value={note}
            maxLength={5000}
            placeholder={messages.eventsNotePlaceholder}
            aria-label={messages.eventsNoteLabel}
            onChange={(event) => setNote(event.target.value)}
            className="block min-h-[72px] w-full resize-none overflow-auto rounded-field bg-fill px-3.5 py-3 text-body text-text placeholder:text-text-faint"
          />
        </div>
      ) : null}
      <Section label={messages.eventsCoverage}>
        <EventsCoverageEdit
          draft={coverage}
          markable={closed}
          index={index}
          onChange={setCoverage}
          onOverlayChange={setCoverageOpen}
        />
      </Section>
      {error ? (
        <p role="alert" className="mt-4 text-small text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-7 flex items-center justify-between">
        {onDelete ? (
          <EndScreenDiscard
            disabled={pending}
            onDiscard={onDelete}
            label={messages.editDelete}
            confirmLabel={messages.eventsDeleteEvent}
            keepLabel={messages.editKeep}
            onOpenChange={setConfirmOpen}
          />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          <IconButton label={messages.editCancel} onClick={onCancel}>
            <CloseIcon />
          </IconButton>
          <Button type="submit" disabled={!canSave}>
            {messages.editSave}
          </Button>
        </div>
      </div>
    </form>
  );
}
