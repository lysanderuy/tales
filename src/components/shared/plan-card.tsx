"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";

import {
  ArchivedTag,
  RecordProgress,
  blockProgressText,
  eventSubjects,
  lookupSubject,
  type OpenRecord,
  type PlanLookup,
} from "@/components/shared/plan-row";
import type { RecordChoice } from "@/components/shared/record-chooser";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { startsOffPlan } from "@/lib/plan/bands";
import { progressFill } from "@/lib/plan/summary";
import { formatClock } from "@/lib/time/zone";
import { formatSeconds } from "@/lib/today/format";
import type { BlockResponse } from "@/validators/block.validator";
import type { EventSummaryResponse } from "@/validators/event.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

type PlanCardProps = {
  block: BlockResponse;
  lookup: PlanLookup;
  past: boolean;
  missed: boolean;
  timeZone: string;
  records: readonly RecordChoice[];
  sessions: readonly SessionResponse[];
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
};

export function PlanCard({
  block,
  lookup,
  past,
  missed,
  timeZone,
  records,
  sessions,
  onOpen,
  onOpenRecord,
}: PlanCardProps) {
  const drag = useDraggable({ id: block.id });
  const { info, archived } = lookupSubject(lookup, block.nodeId);
  const withRecords = past && records.length > 0;
  const status =
    past && (block.plannedMinutes || block.progressSeconds > 0)
      ? blockProgressText(block)
      : block.plannedMinutes
        ? messages.planMinutes(String(block.plannedMinutes))
        : messages.planOpen;

  const first = sessions[0];
  const actualStart = first ? formatClock(new Date(first.startedAt), timeZone) : null;
  const actualSpan =
    withRecords && actualStart && (!block.timeOfDay || startsOffPlan(block.timeOfDay, actualStart))
      ? messages.planStartedAt(actualStart)
      : null;

  const main = (
    <>
      <span className="flex items-start gap-2 text-caption font-semibold leading-[1.3]">
        <span title={info.name} className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">
          {info.name}
        </span>
        {archived ? <ArchivedTag /> : null}
      </span>
      <span className="num mt-1 flex items-center gap-[7px] text-caption text-text-faint">
        <Swatch
          color={info.color}
          className={cn("size-[9px]", archived && "opacity-60 grayscale")}
        />
        {block.timeOfDay}
      </span>
      {actualSpan ? (
        <span className="num mt-1 block text-caption text-text-faint">{actualSpan}</span>
      ) : null}
    </>
  );
  const bar =
    past && block.plannedMinutes ? (
      <span className="block h-1 overflow-hidden rounded-full bg-fill-hover">
        <i
          className="block h-full rounded-full"
          style={{
            width: `${progressFill(block.plannedMinutes, block.progressSeconds)}%`,
            background: info.color,
          }}
        />
      </span>
    ) : null;
  const cardClass =
    "mb-2 block w-full rounded-row bg-fill text-left transition-colors duration-[var(--dur-fast)] hover:bg-fill-hover";
  const cardState = cn("p-2.5", missed && "opacity-70", drag.isDragging && "opacity-40");

  if (withRecords) {
    return (
      <div
        ref={(element) => drag.setNodeRef(element)}
        {...drag.listeners}
        className={cn(cardClass, cardState)}
      >
        <button
          type="button"
          title={`${info.name} · ${blockProgressText(block)}`}
          onClick={(event) => onOpen(block, event.currentTarget)}
          className="block w-full text-left"
        >
          {main}
        </button>
        <span className="mt-2 block">
          {records.length > 1 ? (
            <RecordProgress
              choices={records}
              onOpenRecord={onOpenRecord}
              className="num block rounded-row text-left text-caption text-text-soft underline decoration-dotted underline-offset-2 hover:text-text"
            >
              {status}
            </RecordProgress>
          ) : (
            <span className="num text-caption text-text-soft">{status}</span>
          )}
        </span>
        {bar ? <span className="mt-1.5 block">{bar}</span> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      ref={(element) => drag.setNodeRef(element)}
      {...drag.listeners}
      title={info.name}
      onClick={(event) => onOpen(block, event.currentTarget)}
      className={cn(cardClass, cardState)}
    >
      {main}
      <span className="num mt-2 block text-caption text-text-soft">{status}</span>
      {bar ? <span className="mt-1.5 block">{bar}</span> : null}
    </button>
  );
}

type PlanGhostCardProps = {
  record: SessionResponse;
  lookup: PlanLookup;
  timeZone: string;
  onOpenRecord: OpenRecord;
};

export function PlanGhostCard({ record, lookup, timeZone, onOpenRecord }: PlanGhostCardProps) {
  if (!record.nodeId) return null;
  const { info } = lookupSubject(lookup, record.nodeId);
  const start = formatClock(new Date(record.startedAt), timeZone);
  const end = record.endedAt ? formatClock(new Date(record.endedAt), timeZone) : "";

  return (
    <button
      type="button"
      title={`${info.name} · ${start}–${end}`}
      onClick={(event) => onOpenRecord(record.id, event.currentTarget)}
      className="mb-2 block w-full rounded-row border-[1.5px] border-dashed border-[color-mix(in_srgb,var(--text-faint)_55%,transparent)] p-2.5 text-left hover:bg-fill"
    >
      <span className="block text-caption font-medium leading-[1.3] text-text-soft">
        <span title={info.name} className="line-clamp-2 [overflow-wrap:anywhere]">
          {info.name}
        </span>
      </span>
      <span className="num mt-1 flex items-center gap-[7px] text-caption text-text-faint">
        <Swatch color={info.color} className="size-[9px]" />
      </span>
      <span className="num mt-1 block text-caption text-text-faint">
        {messages.planStartedAt(start)}
      </span>
      <span className="num mt-2 block text-caption text-text-soft">
        {formatSeconds(record.activeSeconds)}
      </span>
    </button>
  );
}

const MAX_EVENT_DOTS = 3;

type PlanEventCardProps = {
  event: EventSummaryResponse;
  lookup: PlanLookup;
};

export function PlanEventCard({ event, lookup }: PlanEventCardProps) {
  const dots = eventSubjects(event, lookup).slice(0, MAX_EVENT_DOTS);

  return (
    <div className="mb-2 flex w-full gap-2.5 rounded-row bg-fill p-2.5">
      <span
        aria-hidden="true"
        className="w-[3px] shrink-0 self-stretch rounded-full bg-text-soft"
      />
      <div className="min-w-0 flex-1">
        <span
          title={event.title}
          className="block text-caption font-semibold leading-[1.3] [overflow-wrap:anywhere]"
        >
          {event.title}
        </span>
        {event.time || dots.length > 0 ? (
          <span className="num mt-1 flex items-center gap-[7px] text-caption text-text-faint">
            {event.time}
            {dots.map(({ info, archived }, position) => (
              <Swatch
                key={position}
                color={info.color}
                className={cn("size-[9px]", archived && "opacity-60 grayscale")}
              />
            ))}
          </span>
        ) : null}
        {event.state === "closed" ? (
          <span className="num mt-2 block text-caption text-text-soft">
            {messages.planEventClosed}
          </span>
        ) : null}
        {event.state === "ready_to_close" ? (
          <Link
            href={`/events?event=${event.id}`}
            className="num mt-2 block text-caption text-text-soft underline decoration-dotted underline-offset-2 hover:text-text"
          >
            {messages.eventsMarkDone}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
