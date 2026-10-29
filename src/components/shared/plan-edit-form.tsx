"use client";

import { useCallback, useEffect, useState } from "react";

import { DateField } from "@/components/shared/date-field";
import { Section, failureText } from "@/components/shared/form-parts";
import { CloseIcon } from "@/components/shared/icons";
import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { EventPicker } from "@/components/shared/event-picker";
import { Picker } from "@/components/shared/picker";
import { lookupSubject, type PlanLookup } from "@/components/shared/plan-row";
import { SubjectTrigger } from "@/components/shared/subject-trigger";
import { TimeField } from "@/components/shared/time-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useCreateBlock } from "@/hooks/use-create-block";
import { useDeleteBlock } from "@/hooks/use-delete-block";
import { useUpdateBlock, type UpdateBlockVariables } from "@/hooks/use-update-block";
import { useEvents } from "@/hooks/use-events";
import { cn } from "@/lib/cn";
import { formatEventMeta } from "@/lib/events/dates";
import { messages } from "@/lib/messages";
import { endOfSpan, minutesBetween } from "@/lib/plan/time";
import { formatPath } from "@/lib/today/subject-index";
import type { BlockResponse } from "@/validators/block.validator";
import type { EventSummaryResponse } from "@/validators/event.validator";

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

function choiceMinutes(choice: MinuteChoice, customText: string): number | null {
  if (choice === "open") return null;
  if (choice === "custom") return parseCustom(customText) ?? null;
  return choice;
}

function endFor(start: string, minutes: number | null): string {
  return start && minutes !== null ? endOfSpan(start, minutes).clock : "";
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
  focusCustom: boolean;
  onChoice: (choice: MinuteChoice) => void;
  onCustomText: (text: string) => void;
  onCommitCustom: () => void;
};

function MinutesChips({
  choice,
  customText,
  focusCustom,
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
          autoFocus={focusCustom}
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

type EventLinkFieldProps = {
  eventId: string | null;
  nodeId: string | null;
  today: string;
  past?: boolean;
  onChange: (eventId: string | null) => void;
  onOpenChange?: (open: boolean) => void;
};

export function useEventCandidates(
  eventId: string | null,
  nodeId: string | null,
): { candidates: EventSummaryResponse[]; visible: boolean } {
  const { data } = useEvents();
  const candidates = [...(data?.events ?? [])].sort((a, b) => {
    const closed = Number(a.state === "closed") - Number(b.state === "closed");
    if (closed !== 0) return closed;
    const covers =
      Number(!!nodeId && b.coverIds.includes(nodeId)) -
      Number(!!nodeId && a.coverIds.includes(nodeId));
    if (covers !== 0) return covers;
    const order = a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "");
    return a.state === "closed" ? -order : order;
  });
  return { candidates, visible: eventId !== null || candidates.length > 0 };
}

export function EventLinkBody({
  eventId,
  nodeId,
  today,
  past,
  onChange,
  onOpenChange,
}: EventLinkFieldProps) {
  const { candidates, visible } = useEventCandidates(eventId, nodeId);
  const question = past ? messages.planEventPlaceholderPast : messages.planEventPlaceholder;
  const [open, setOpen] = useState(false);
  const [button, setButton] = useState<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const linked = eventId ? candidates.find((event) => event.id === eventId) : undefined;

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  if (!visible) return null;

  return (
    <>
      <button
        ref={setButton}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[52px] w-full items-baseline justify-between gap-3 rounded-field bg-fill px-4 py-3.5 text-left text-body transition-colors hover:bg-fill-hover"
      >
        {eventId ? (
          <>
            <span className="min-w-0 truncate">{linked?.title ?? messages.planEventFallback}</span>
            {linked ? (
              <span className="num shrink-0 text-small text-text-faint">
                {formatEventMeta(linked.date, linked.time, today, linked.endTime)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-text-faint">{question}</span>
        )}
      </button>
      {open ? (
        <EventPicker
          anchor={button}
          events={candidates}
          selectedId={eventId}
          today={today}
          label={question}
          onPick={onChange}
          onClose={close}
        />
      ) : null}
    </>
  );
}

export function EventLinkField(props: EventLinkFieldProps) {
  const { visible } = useEventCandidates(props.eventId, props.nodeId);
  if (!visible) return null;
  return (
    <Section label={messages.planEventLabel}>
      <EventLinkBody {...props} />
    </Section>
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
  const [eventId, setEventId] = useState<string | null>(block?.eventId ?? null);
  const [time, setTime] = useState(block?.timeOfDay ?? "");
  const [timeValid, setTimeValid] = useState(true);
  const [endDefault, setEndDefault] = useState(() =>
    endFor(block?.timeOfDay ?? "", block?.plannedMinutes ?? null),
  );
  const [endKey, setEndKey] = useState(0);
  const [endError, setEndError] = useState<string | undefined>();
  const [focusCustom, setFocusCustom] = useState(false);
  const [minutesError, setMinutesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const busy = create.isPending || update.isPending || remove.isPending;

  useEffect(() => {
    onOverlayChange(pickerOpen || dateOpen || confirmOpen || eventPickerOpen);
  }, [pickerOpen, dateOpen, confirmOpen, eventPickerOpen, onOverlayChange]);

  const fillEnd = (start: string, minutes: number | null) => {
    setEndDefault(endFor(start, minutes));
    setEndError(undefined);
    setEndKey((key) => key + 1);
  };

  const onChoice = (next: MinuteChoice) => {
    setChoice(next);
    setMinutesError(null);
    setFocusCustom(next === "custom");
    if (next !== "custom") fillEnd(time, choiceMinutes(next, customText));
  };

  const onCustomText = (text: string) => {
    setCustomText(text);
    setMinutesError(null);
    const value = parseCustom(text);
    fillEnd(time, typeof value === "number" ? value : null);
  };

  const onStartChange = (value: string, valid: boolean) => {
    setTime(value);
    setTimeValid(valid);
    if (valid) fillEnd(value, choiceMinutes(choice, customText));
  };

  const onEndChange = (value: string, valid: boolean) => {
    if (!valid || value === "" || time === "") return;
    const minutes = minutesBetween(time, value);
    if (minutes === 24 * 60 || minutes > MAX_MINUTES) {
      setEndError(minutes === 24 * 60 ? messages.timeEndSameAsStart : messages.timeEndTooLong);
      return;
    }
    setEndError(undefined);
    setFocusCustom(false);
    setChoice("custom");
    setCustomText(String(minutes));
    setMinutesError(null);
  };

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
        await create.mutateAsync({
          nodeId,
          date,
          plannedMinutes,
          timeOfDay,
          ...(eventId ? { eventId } : {}),
        });
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
    if (eventId !== block.eventId) patch.eventId = eventId;
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
            onChange={onStartChange}
          />
        </div>
        <div className="min-w-0 flex-1">
          <TimeField
            key={endKey}
            label={messages.planEndTimeLabel}
            defaultValue={endDefault}
            disabled={time === ""}
            error={endError}
            onChange={onEndChange}
          />
        </div>
      </div>

      <Section label={messages.planMinutesLabel}>
        <MinutesChips
          choice={choice}
          customText={customText}
          focusCustom={focusCustom}
          onChoice={onChoice}
          onCustomText={onCustomText}
          onCommitCustom={commitCustom}
        />
        {minutesError ? (
          <p role="alert" className="mt-2 text-small text-danger">
            {minutesError}
          </p>
        ) : null}
      </Section>

      <EventLinkField
        eventId={eventId}
        nodeId={nodeId}
        today={today}
        onChange={setEventId}
        onOpenChange={setEventPickerOpen}
      />

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
          <Button
            disabled={busy || !nodeId || !timeValid || !!endError}
            onClick={() => void onSave()}
          >
            {messages.editSave}
          </Button>
        </div>
      </div>
    </>
  );
}
