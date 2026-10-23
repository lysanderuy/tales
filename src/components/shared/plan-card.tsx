"use client";

import { useDraggable } from "@dnd-kit/core";

import {
  ArchivedTag,
  RecordProgress,
  blockProgressText,
  lookupSubject,
  type OpenRecord,
  type PlanLookup,
} from "@/components/shared/plan-row";
import type { RecordChoice } from "@/components/shared/record-chooser";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { progressFill } from "@/lib/plan/summary";
import { formatClock } from "@/lib/time/zone";
import { formatSeconds } from "@/lib/today/format";
import type { BlockResponse } from "@/validators/block.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

type PlanCardProps = {
  block: BlockResponse;
  lookup: PlanLookup;
  past: boolean;
  records: readonly RecordChoice[];
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
};

export function PlanCard({ block, lookup, past, records, onOpen, onOpenRecord }: PlanCardProps) {
  const drag = useDraggable({ id: block.id });
  const { info, archived } = lookupSubject(lookup, block.nodeId);
  const swatch = (
    <Swatch color={info.color} className={cn("size-[9px]", archived && "opacity-60 grayscale")} />
  );
  const planned = block.plannedMinutes
    ? messages.planMinutes(String(block.plannedMinutes))
    : `${messages.planOpen}${past && block.progressSeconds > 0 ? ` · ${formatSeconds(block.progressSeconds)}` : ""}`;

  const withRecords = past && records.length > 0;

  const main = (
    <>
      <span className="flex items-start gap-2 text-caption font-semibold leading-[1.3]">
        <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere]">{info.name}</span>
        {archived ? <ArchivedTag /> : null}
      </span>
      <span className="num mt-1 flex flex-wrap items-center gap-x-[9px] text-caption text-text-soft">
        {block.timeOfDay ? (
          <>
            <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
              {swatch}
              <span className="text-text-faint">{block.timeOfDay}</span>
            </span>
            {withRecords ? null : <span className="whitespace-nowrap">{planned}</span>}
          </>
        ) : withRecords ? (
          swatch
        ) : (
          <span className="inline-flex items-center gap-[7px] whitespace-nowrap">
            {swatch}
            {planned}
          </span>
        )}
      </span>
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

  if (withRecords) {
    return (
      <div
        ref={(element) => drag.setNodeRef(element)}
        {...drag.listeners}
        className={cn(cardClass, "p-2.5", drag.isDragging && "opacity-40")}
      >
        <button
          type="button"
          title={`${info.name} · ${blockProgressText(block)}`}
          onClick={(event) => onOpen(block, event.currentTarget)}
          className="block w-full text-left"
        >
          {main}
        </button>
        <RecordProgress
          choices={records}
          onOpenRecord={onOpenRecord}
          className="num mt-1 block rounded-row text-left text-caption text-text-soft underline decoration-dotted underline-offset-2 hover:text-text"
        >
          {blockProgressText(block)}
        </RecordProgress>
        {bar ? <span className="mt-2 block">{bar}</span> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      ref={(element) => drag.setNodeRef(element)}
      {...drag.listeners}
      title={past ? `${info.name} · ${blockProgressText(block)}` : info.name}
      onClick={(event) => onOpen(block, event.currentTarget)}
      className={cn(cardClass, "p-2.5", drag.isDragging && "opacity-40")}
    >
      {main}
      {bar ? <span className="mt-2 block">{bar}</span> : null}
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
        <span className="line-clamp-2 [overflow-wrap:anywhere]">{info.name}</span>
      </span>
      <span className="num mt-1 inline-flex items-center gap-[7px] text-caption text-text-soft">
        <Swatch color={info.color} className="size-[9px]" />
        {formatSeconds(record.activeSeconds)}
      </span>
    </button>
  );
}
