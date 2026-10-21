"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { EditRecordSubject } from "@/components/shared/edit-record-subject";
import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { EndScreenMethods } from "@/components/shared/end-screen-methods";
import { CloseIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import { useDeleteSession } from "@/hooks/use-delete-session";
import { sessionKeys } from "@/hooks/use-session";
import { useSubjects } from "@/hooks/use-subjects";
import { useUpdateSession } from "@/hooks/use-update-session";
import { ApiError } from "@/lib/api/client";
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
const USER_FACING_STATUSES = new Set([400, 404, 409, 422]);

function failureText(error: unknown): string {
  return error instanceof ApiError && USER_FACING_STATUSES.has(error.status)
    ? error.message
    : messages.serverError;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <Eyebrow as="div" className="mb-2">
        {label}
      </Eyebrow>
      {children}
    </div>
  );
}

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = update.isPending || remove.isPending;

  useEffect(() => {
    onOverlayChange(pickerOpen || confirmOpen);
  }, [pickerOpen, confirmOpen, onOverlayChange]);

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
      <Section label={messages.todayWhatStudying}>
        <EditRecordSubject
          nodeId={edits.nodeId}
          blockId={edits.blockId}
          subject={subject}
          onPick={(nodeId, blockId) => patch({ nodeId, blockId })}
          onOpenChange={setPickerOpen}
        />
      </Section>

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

      <div className="mt-6 flex gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            label={messages.editStart}
            type="time"
            value={edits.start}
            onChange={(event) => patch({ start: event.target.value })}
            className="num"
          />
        </div>
        {record.endedAt ? (
          <div className="min-w-0 flex-1">
            <TextField
              label={messages.editEnd}
              type="time"
              value={edits.end}
              onChange={(event) => patch({ end: event.target.value })}
              className="num"
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
