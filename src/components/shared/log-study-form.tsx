"use client";

import { useEffect, useState } from "react";

import { DateField } from "@/components/shared/date-field";
import { EndScreenMethods } from "@/components/shared/end-screen-methods";
import { CloseIcon } from "@/components/shared/icons";
import { Section, failureText } from "@/components/shared/form-parts";
import { PlanSubjectField } from "@/components/shared/plan-edit-form";
import type { PlanLookup } from "@/components/shared/plan-row";
import { TimeField } from "@/components/shared/time-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useCreateRecord } from "@/hooks/use-create-record";
import { messages } from "@/lib/messages";
import { clampDate } from "@/lib/plan/dates";
import { zonedInstant } from "@/lib/time/zone";
import { normalizeNote, type EndMethodTag } from "@/lib/timer/end-screen";

const NOTE_MAX_LENGTH = 5000;

type LogStudyFormProps = {
  defaultDate: string;
  today: string;
  timeZone: string;
  lookup: PlanLookup;
  onClose: () => void;
  onOverlayChange: (open: boolean) => void;
};

export function LogStudyForm({
  defaultDate,
  today,
  timeZone,
  lookup,
  onClose,
  onOverlayChange,
}: LogStudyFormProps) {
  const create = useCreateRecord({ toastOnError: false });
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [date, setDate] = useState(() => clampDate(defaultDate, undefined, today));
  const [start, setStart] = useState({ value: "", valid: true });
  const [end, setEnd] = useState({ value: "", valid: true });
  const [methodTag, setMethodTag] = useState<EndMethodTag | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    onOverlayChange(pickerOpen || dateOpen);
  }, [pickerOpen, dateOpen, onOverlayChange]);

  const canSave =
    nodeId !== null && start.valid && start.value !== "" && end.valid && end.value !== "";

  const onSave = async () => {
    if (!nodeId || !canSave) return;
    if (end.value <= start.value) {
      setError(messages.endBeforeStart);
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        nodeId,
        startedAt: zonedInstant(date, start.value, timeZone).toISOString(),
        endedAt: zonedInstant(date, end.value, timeZone).toISOString(),
        methodTag,
        note: normalizeNote(note),
      });
    } catch (failure) {
      setError(failureText(failure));
      return;
    }
    onClose();
  };

  return (
    <>
      <div className="mt-6">
        <PlanSubjectField
          nodeId={nodeId}
          lookup={lookup}
          autoOpen
          placeholder={messages.todayWhatStudied}
          onPick={(picked) => {
            setNodeId(picked);
            setError(null);
          }}
          onOpenChange={setPickerOpen}
        />
      </div>

      <div className="mt-6">
        <DateField
          label={messages.planDateLabel}
          value={date}
          onChange={setDate}
          today={today}
          max={today}
          onOpenChange={setDateOpen}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <div className="min-w-0 flex-1">
          <TimeField
            label={messages.editStart}
            onChange={(value, valid) => {
              setStart({ value, valid });
              setError(null);
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <TimeField
            label={messages.editEnd}
            onChange={(value, valid) => {
              setEnd({ value, valid });
              setError(null);
            }}
          />
        </div>
      </div>

      <Section label={messages.endMethod}>
        <EndScreenMethods value={methodTag} onChange={setMethodTag} />
      </Section>

      <Section label={messages.endNote}>
        <textarea
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={messages.endNotePlaceholder}
          aria-label={messages.endNote}
          onChange={(event) => setNote(event.target.value)}
          className="block h-20 w-full resize-none rounded-field bg-fill px-3.5 py-3 text-body text-text placeholder:text-text-faint"
        />
      </Section>

      {error ? (
        <p role="alert" className="mt-4 text-small text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <IconButton label={messages.editCancel} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Button disabled={create.isPending || !canSave} onClick={() => void onSave()}>
          {messages.editSave}
        </Button>
      </div>
    </>
  );
}
