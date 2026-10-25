"use client";

import { useMemo, useState } from "react";

import { EventsCoverage } from "@/components/shared/events-coverage";
import { EventsForm, type EventFormValue } from "@/components/shared/events-form";
import { EventsMenu } from "@/components/shared/events-menu";
import { EventsTimeSpent } from "@/components/shared/events-time-spent";
import { failureText } from "@/components/shared/form-parts";
import { CloseIcon, MoreIcon } from "@/components/shared/icons";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { useCloseEvent } from "@/hooks/use-close-event";
import { useDeleteEvent } from "@/hooks/use-delete-event";
import { useEvent } from "@/hooks/use-event";
import { useUpdateEvent } from "@/hooks/use-update-event";
import { formatEventLine } from "@/lib/events/dates";
import { diffMarks, marksToRecord } from "@/lib/events/marks";
import { messages } from "@/lib/messages";
import type { SubjectIndex } from "@/lib/today/subject-index";
import { useToastStore } from "@/stores/toast.store";
import type { EventSummaryResponse } from "@/validators/event.validator";

type EventsDetailProps = {
  event: EventSummaryResponse;
  index: SubjectIndex;
  today: string;
  timeZone: string;
  className?: string;
  onClose: () => void;
  onDeleted: () => void;
};

export function EventsDetail({
  event,
  index,
  today,
  timeZone,
  className,
  onClose,
  onDeleted,
}: EventsDetailProps) {
  const detail = useEvent(event.id).data;
  const update = useUpdateEvent({ toastOnError: false });
  const close = useCloseEvent();
  const closeQuietly = useCloseEvent({ toastOnError: false });
  const remove = useDeleteEvent({ toastOnError: false });
  const showToast = useToastStore((state) => state.show);
  const [editing, setEditing] = useState<{ focusNote: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const marks = useMemo(() => marksToRecord(detail?.marks ?? []), [detail?.marks]);
  const isClosed = event.state === "closed";
  const isPast = event.state !== "upcoming";
  const note = detail?.note?.trim() ? detail.note : "";

  async function save(value: EventFormValue) {
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      await update.mutateAsync({
        id: event.id,
        title: value.title,
        date: value.date,
        time: value.time,
        coverIds: value.coverIds,
      });
      if (isClosed) {
        await closeQuietly.mutateAsync({
          id: event.id,
          note: value.note.trimEnd() || null,
          marks: diffMarks(detail.marks, value.marks),
        });
      }
      showToast(messages.eventsSaved);
      setEditing(null);
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setSaving(true);
    setError(null);
    try {
      await remove.mutateAsync(event.id);
      showToast(messages.eventsDeleted);
      onDeleted();
    } catch (failure) {
      setError(failureText(failure));
      setSaving(false);
    }
  }

  function beginEdit(focusNote: boolean) {
    setError(null);
    setEditing({ focusNote });
  }

  if (editing && detail) {
    return (
      <Card className={className}>
        <EventsForm
          initial={{
            title: event.title,
            date: event.date,
            time: event.time ?? "",
            covers: event.coverIds,
            note: detail.note ?? "",
            marks,
          }}
          today={today}
          index={index}
          closed={isClosed}
          pending={saving}
          error={error}
          focusNote={editing.focusNote}
          onSubmit={(value) => void save(value)}
          onCancel={() => setEditing(null)}
          onDelete={() => void onDelete()}
        />
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            title={event.title}
            className="text-h2 font-semibold leading-[1.25] tracking-[-0.01em]"
          >
            {event.title}
          </h2>
          <div className="num mt-1 text-small text-text-soft">
            {formatEventLine(
              { date: event.date, time: event.time, upcoming: event.state === "upcoming" },
              today,
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {event.state === "ready_to_close" ? (
            <button
              type="button"
              disabled={close.isPending}
              onClick={() => close.mutate({ id: event.id })}
              className="press min-h-10 whitespace-nowrap rounded-full bg-primary px-[18px] py-2 text-ui font-medium text-on-primary hover:opacity-90 disabled:opacity-50"
            >
              {messages.eventsMarkDone}
            </button>
          ) : null}
          {detail ? (
            <EventsMenu
              items={[{ label: messages.eventsEdit, run: () => beginEdit(false) }]}
              trigger={({ triggerRef, open, toggle }) => (
                <IconButton
                  ref={triggerRef}
                  size="sm"
                  label={messages.eventsMore}
                  aria-haspopup="true"
                  aria-expanded={open}
                  onClick={toggle}
                >
                  <MoreIcon size={20} />
                </IconButton>
              )}
            />
          ) : null}
          <IconButton size="sm" label={messages.eventsClose} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      {isClosed && detail ? (
        <div className="mt-6">
          {note ? (
            <p className="whitespace-pre-wrap text-ui leading-[1.55] [overflow-wrap:anywhere]">
              {note}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => beginEdit(true)}
              className="text-left text-body text-text-faint underline decoration-border underline-offset-4 hover:text-text-soft"
            >
              {messages.eventsNotePlaceholder}
            </button>
          )}
        </div>
      ) : null}

      {event.coverIds.length > 0 ? (
        <div className="mt-6">
          <Eyebrow as="div" className="mb-2">
            {messages.eventsCoverage}
          </Eyebrow>
          <EventsCoverage
            coverIds={event.coverIds}
            marks={marks}
            index={index}
            showMarks={isClosed}
          />
        </div>
      ) : null}

      {isPast && detail ? (
        <EventsTimeSpent sessions={detail.sessions} index={index} timeZone={timeZone} />
      ) : null}
    </Card>
  );
}
