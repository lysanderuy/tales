"use client";

import { useCallback, useEffect, useState } from "react";

import { DateField } from "@/components/shared/date-field";
import { Section, failureText } from "@/components/shared/form-parts";
import { CloseIcon } from "@/components/shared/icons";
import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { Picker } from "@/components/shared/picker";
import { lookupSubject, type PlanLookup } from "@/components/shared/plan-row";
import { SubjectTrigger } from "@/components/shared/subject-trigger";
import { TimeField } from "@/components/shared/time-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useCreateBlock } from "@/hooks/use-create-block";
import { useDeleteBlock } from "@/hooks/use-delete-block";
import { useUpdateBlock, type UpdateBlockVariables } from "@/hooks/use-update-block";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { formatPath } from "@/lib/today/subject-index";
import type { BlockResponse } from "@/validators/block.validator";

const MIN_MINUTES = 1;
const MAX_MINUTES = 720;
const PRESETS = [25, 45, 60, 90];

type MinuteChoice = "open" | "custom" | number;

function parseCustom(raw: string): number | null | undefined {
  const text = raw.trim();
  if (text === "") return null;
  const value = Number(text);
  return Number.isInteger(value) && value >= MIN_MINUTES && value <= MAX_MINUTES
    ? value
    : undefined;
}

function initialChoice(minutes: number | null): MinuteChoice {
  if (minutes === null) return "open";
  return PRESETS.includes(minutes) ? minutes : "custom";
}

type SubjectFieldProps = {
  nodeId: string | null;
  lookup: PlanLookup;
  autoOpen: boolean;
  placeholder?: string;
  onPick: (nodeId: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function PlanSubjectField({
  nodeId,
  lookup,
  autoOpen,
  placeholder,
  onPick,
  onOpenChange,
}: SubjectFieldProps) {
  const [open, setOpen] = useState(autoOpen);
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const subject = nodeId ? lookupSubject(lookup, nodeId) : null;
  const path = subject ? formatPath(subject.info.ancestors) : "";

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  return (
    <>
      <SubjectTrigger
        triggerRef={setButton}
        open={open}
        onToggle={() => setOpen((value) => !value)}
        name={subject ? subject.info.name : null}
        path={path}
        archived={subject?.archived}
        placeholder={placeholder}
      />
      {open ? (
        <Picker
          anchor={button}
          selected={{ nodeId: nodeId ?? "", blockId: null }}
          onPick={(picked) => onPick(picked)}
          onClose={close}
          hidePlanned
        />
      ) : null}
    </>
  );
}

const chipClass = "num rounded-full px-[11px] py-[7px] text-small";
const chipOn = "bg-primary-soft font-medium text-primary";
const chipOff = "bg-fill hover:bg-fill-hover";

type MinutesChipsProps = {
  choice: MinuteChoice;
  customText: string;
  onChoice: (choice: MinuteChoice) => void;
  onCustomText: (text: string) => void;
  onCommitCustom: () => void;
};

function MinutesChips({
  choice,
  customText,
  onChoice,
  onCustomText,
  onCommitCustom,
}: MinutesChipsProps) {
  return (
    <div role="group" aria-label={messages.planMinutesLabel} className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={choice === "open"}
        onClick={() => onChoice("open")}
        className={cn(chipClass, choice === "open" ? chipOn : chipOff)}
      >
        {messages.planOpen}
      </button>
      {PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          aria-pressed={choice === preset}
          onClick={() => onChoice(preset)}
          className={cn(chipClass, choice === preset ? chipOn : chipOff)}
        >
          {preset}
        </button>
      ))}
      {choice === "custom" ? (
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          autoFocus
          value={customText}
          placeholder={messages.todayCustomMinutes}
          aria-label={messages.todayCustomMinutesLabel}
          onChange={(event) => onCustomText(event.target.value.replace(/\D/g, ""))}
          onBlur={onCommitCustom}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onCommitCustom();
          }}
          className={cn(
            chipClass,
            chipOn,
            "w-[84px] text-center placeholder:text-primary/60 focus-visible:outline-offset-2",
          )}
        />
      ) : (
        <button type="button" onClick={() => onChoice("custom")} className={cn(chipClass, chipOff)}>
          {messages.todayCustomMinutes}
        </button>
      )}
    </div>
  );
}

type PlanEditFormProps = {
  block: BlockResponse | null;
  defaultDate: string;
  today: string;
  lookup: PlanLookup;
  onClose: () => void;
  onOverlayChange: (open: boolean) => void;
};

export function PlanEditForm({
  block,
  defaultDate,
  today,
  lookup,
  onClose,
  onOverlayChange,
}: PlanEditFormProps) {
  const create = useCreateBlock({ toastOnError: false });
  const update = useUpdateBlock({ toastOnError: false });
  const remove = useDeleteBlock({ toastOnError: false });
  const [nodeId, setNodeId] = useState<string | null>(block?.nodeId ?? null);
  const [choice, setChoice] = useState<MinuteChoice>(() =>
    initialChoice(block?.plannedMinutes ?? null),
  );
  const [customText, setCustomText] = useState(
    initialChoice(block?.plannedMinutes ?? null) === "custom" ? String(block?.plannedMinutes) : "",
  );
  const [date, setDate] = useState(block?.date ?? defaultDate);
  const [time, setTime] = useState(block?.timeOfDay ?? "");
  const [timeValid, setTimeValid] = useState(true);
  const [minutesError, setMinutesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = create.isPending || update.isPending || remove.isPending;

  useEffect(() => {
    onOverlayChange(pickerOpen || dateOpen || confirmOpen);
  }, [pickerOpen, dateOpen, confirmOpen, onOverlayChange]);

  const commitCustom = () => {
    const value = parseCustom(customText);
    if (value === null) {
      setChoice("open");
      setMinutesError(null);
    } else if (value === undefined) {
      setMinutesError(messages.planMinutesRange);
    } else {
      if (PRESETS.includes(value)) setChoice(value);
      setMinutesError(null);
    }
  };

  const onSave = async () => {
    let plannedMinutes: number | null;
    if (choice === "open") plannedMinutes = null;
    else if (choice === "custom") {
      const value = parseCustom(customText);
      if (value === undefined) {
        setMinutesError(messages.planMinutesRange);
        return;
      }
      plannedMinutes = value;
    } else plannedMinutes = choice;
    if (!nodeId) return;
    const timeOfDay = time === "" ? null : time;
    if (!block) {
      setError(null);
      try {
        await create.mutateAsync({ nodeId, date, plannedMinutes, timeOfDay });
      } catch (failure) {
        setError(failureText(failure));
        return;
      }
      onClose();
      return;
    }
    const patch: Omit<UpdateBlockVariables, "id"> = {};
    if (nodeId !== block.nodeId) patch.nodeId = nodeId;
    if (plannedMinutes !== block.plannedMinutes) patch.plannedMinutes = plannedMinutes;
    if (date !== block.date) patch.date = date;
    if (timeOfDay !== block.timeOfDay) patch.timeOfDay = timeOfDay;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({ id: block.id, ...patch });
    } catch (failure) {
      setError(failureText(failure));
      return;
    }
    onClose();
  };

  const onDelete = async () => {
    if (!block) return;
    setError(null);
    try {
      await remove.mutateAsync(block.id);
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
          autoOpen={!block}
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
          onOpenChange={setDateOpen}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <div className="min-w-0 flex-1">
          <TimeField
            label={messages.planTimeLabel}
            defaultValue={block?.timeOfDay ?? ""}
            onChange={(value, valid) => {
              setTime(value);
              setTimeValid(valid);
            }}
          />
        </div>
        <div aria-hidden="true" className="min-w-0 flex-1" />
      </div>

      <Section label={messages.planMinutesLabel}>
        <MinutesChips
          choice={choice}
          customText={customText}
          onChoice={(next) => {
            setChoice(next);
            setMinutesError(null);
          }}
          onCustomText={(text) => {
            setCustomText(text);
            setMinutesError(null);
          }}
          onCommitCustom={commitCustom}
        />
        {minutesError ? (
          <p role="alert" className="mt-2 text-small text-danger">
            {minutesError}
          </p>
        ) : null}
      </Section>

      {error ? (
        <p role="alert" className="mt-4 text-small text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        {block ? (
          <EndScreenDiscard
            disabled={busy}
            onDiscard={() => void onDelete()}
            label={messages.editDelete}
            confirmLabel={messages.planDeleteThis}
            keepLabel={messages.editKeep}
            onOpenChange={setConfirmOpen}
          />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          <IconButton label={messages.editCancel} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Button disabled={busy || !nodeId || !timeValid} onClick={() => void onSave()}>
            {messages.editSave}
          </Button>
        </div>
      </div>
    </>
  );
}
