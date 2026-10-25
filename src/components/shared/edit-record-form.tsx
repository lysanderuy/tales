"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { EditRecordSubject } from "@/components/shared/edit-record-subject";
import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { EndScreenMethods } from "@/components/shared/end-screen-methods";
import { Section, failureText } from "@/components/shared/form-parts";
import { CloseIcon } from "@/components/shared/icons";
import { EventLinkField } from "@/components/shared/plan-edit-form";
import { TimeField } from "@/components/shared/time-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useDeleteSession } from "@/hooks/use-delete-session";
import { sessionKeys } from "@/hooks/use-session";
import { useSubjects } from "@/hooks/use-subjects";
import { useToday } from "@/hooks/use-today";
import { useUpdateSession } from "@/hooks/use-update-session";
import { messages } from "@/lib/messages";
import { localDateKey } from "@/lib/time/zone";
import {
  buildRecordPatch,
  isEmptyPatch,
  recordEdits,
  type RecordEdits,
} from "@/lib/timer/record-edit";
import { formatDayLabel } from "@/lib/today/format";
import { buildSubjectIndex, resolveSubject } from "@/lib/today/subject-index";
import type { SessionResponse } from "@/validators/study-session.validator";

const NOTE_MAX_LENGTH = 5000;

type EditRecordFormProps = {
  record: SessionResponse;
  timeZone: string;
  onClose: () => void;
  onOverlayChange: (open: boolean) => void;
};

export function EditRecordForm({
  record,
  timeZone,
  onClose,
  onOverlayChange,
}: EditRecordFormProps) {
  const queryClient = useQueryClient();
  const update = useUpdateSession({ toastOnError: false });
  const remove = useDeleteSession({ toastOnError: false });
  const subjects = useSubjects();
  const [edits, setEdits] = useState<RecordEdits>(() => recordEdits(record, timeZone));
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startValid, setStartValid] = useState(true);
  const [endValid, setEndValid] = useState(true);
  const busy = update.isPending || remove.isPending;

  useEffect(() => {
    onOverlayChange(pickerOpen || eventOpen || confirmOpen);
  }, [pickerOpen, eventOpen, confirmOpen, onOverlayChange]);

  const today = useToday().data?.todayDate;

  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);
  const subject = edits.nodeId
    ? subjects.isSuccess
      ? resolveSubject(index, edits.nodeId, messages.todayUnknownSubject)
      : (index.get(edits.nodeId) ?? null)
    : null;

  const startDay = localDateKey(new Date(record.startedAt), timeZone);
  const endDay = record.endedAt ? localDateKey(new Date(record.endedAt), timeZone) : startDay;

  const patch = (changes: Partial<RecordEdits>) => {
    setEdits((current) => ({ ...current, ...changes }));
    setError(null);
  };

  const finish = () => {
    void queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    onClose();
  };

  const onSave = async () => {
    if (!startValid || !endValid) {
      setError(messages.timeInvalid);
      return;
    }
    const result = buildRecordPatch(record, edits, timeZone);
    if (!result.ok) {
      setError(
        result.error === "endBeforeStart" ? messages.endBeforeStart : messages.editTimeRequired,
      );
      return;
    }
    if (isEmptyPatch(result.patch)) {
      onClose();
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({ id: record.id, ...result.patch });
    } catch (failure) {
      setError(failureText(failure));
      return;
    }
    finish();
  };

  const onDelete = async () => {
    setError(null);
    try {
      await remove.mutateAsync(record.id);
    } catch (failure) {
      setError(failureText(failure));
      return;
    }
    finish();
  };

  return (
    <>
      <div className="mt-6">
        <EditRecordSubject
          nodeId={edits.nodeId}
          blockId={edits.blockId}
          subject={subject}
          onPick={(nodeId, blockId) => patch({ nodeId, blockId })}
          onOpenChange={setPickerOpen}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <div className="min-w-0 flex-1">
          <TimeField
            label={messages.editStart}
            defaultValue={edits.start}
            onChange={(value, valid) => {
              setStartValid(valid);
              patch({ start: value });
            }}
          />
        </div>
        {record.endedAt ? (
          <div className="min-w-0 flex-1">
            <TimeField
              label={messages.editEnd}
              defaultValue={edits.end}
              onChange={(value, valid) => {
                setEndValid(valid);
                patch({ end: value });
              }}
              trailing={
                endDay !== startDay ? (
                  <span className="num whitespace-nowrap text-small text-text-soft">
                    {formatDayLabel(endDay)}
                  </span>
                ) : undefined
              }
            />
          </div>
        ) : null}
      </div>

      {today ? (
        <EventLinkField
          eventId={edits.eventId}
          nodeId={edits.nodeId}
          today={today}
          past
          onChange={(eventId) => patch({ eventId })}
          onOpenChange={setEventOpen}
        />
      ) : null}

      <Section label={messages.endMethod}>
        <EndScreenMethods value={edits.methodTag} onChange={(methodTag) => patch({ methodTag })} />
      </Section>

      <Section label={messages.endNote}>
        <textarea
          value={edits.note}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={messages.endNotePlaceholder}
          aria-label={messages.endNote}
          onChange={(event) => patch({ note: event.target.value })}
          className="block h-20 w-full resize-none rounded-field bg-fill px-3.5 py-3 text-body text-text placeholder:text-text-faint"
        />
      </Section>

      <p role="alert" className="mt-2 min-h-5 text-small text-danger">
        {error}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <EndScreenDiscard
          disabled={busy}
          onDiscard={() => void onDelete()}
          label={messages.editDelete}
          confirmLabel={messages.editDeleteThis}
          keepLabel={messages.editKeep}
          onOpenChange={setConfirmOpen}
        />
        <div className="flex items-center gap-2.5">
          <IconButton label={messages.editCancel} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Button disabled={busy} onClick={() => void onSave()}>
            {messages.editSave}
          </Button>
        </div>
      </div>
    </>
  );
}
