"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { PlayIcon } from "@/components/shared/icons";
import { RecordChooser, type RecordChoice } from "@/components/shared/record-chooser";
import { IconButton } from "@/components/ui/icon-button";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { EDGE, placeFloating } from "@/lib/picker/position";
import { progressFill } from "@/lib/plan/summary";
import { formatClock } from "@/lib/time/zone";
import { formatProgress, formatSeconds } from "@/lib/today/format";
import {
  formatPath,
  resolveSubject,
  type SubjectIndex,
  type SubjectInfo,
} from "@/lib/today/subject-index";
import type { BlockResponse } from "@/validators/block.validator";
import type { EventSummaryResponse } from "@/validators/event.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

export type PlanLookup = {
  index: SubjectIndex;
  archived: ReadonlySet<string>;
};

export type OpenRecord = (recordId: string, opener: HTMLElement) => void;

const CHOOSER_WIDTH = 220;
const CHOOSER_ROW_HEIGHT = 44;

export function lookupSubject(
  lookup: PlanLookup,
  nodeId: string,
): { info: SubjectInfo; archived: boolean } {
  return {
    info: resolveSubject(lookup.index, nodeId, messages.todayUnknownSubject),
    archived: lookup.archived.has(nodeId),
  };
}

export function eventSubjects(
  event: EventSummaryResponse,
  lookup: PlanLookup,
): { info: SubjectInfo; archived: boolean }[] {
  return event.coverIds
    .filter((nodeId) => lookup.index.has(nodeId))
    .map((nodeId) => lookupSubject(lookup, nodeId));
}

export function blockProgressText(block: BlockResponse): string {
  return block.plannedMinutes
    ? formatProgress(block.plannedMinutes, block.progressSeconds)
    : formatSeconds(block.progressSeconds);
}

export function recordChoicesByBlock(
  records: readonly SessionResponse[],
  timeZone: string,
): Map<string, RecordChoice[]> {
  const byBlock = new Map<string, RecordChoice[]>();
  const sorted = [...records].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  for (const record of sorted) {
    if (record.blockId === null || record.endedAt === null) continue;
    const start = formatClock(new Date(record.startedAt), timeZone);
    const end = formatClock(new Date(record.endedAt), timeZone);
    byBlock.set(record.blockId, [
      ...(byBlock.get(record.blockId) ?? []),
      { recordId: record.id, label: `${start}–${end} · ${formatSeconds(record.activeSeconds)}` },
    ]);
  }
  return byBlock;
}

export function ArchivedTag() {
  return (
    <span className="shrink-0 rounded-full bg-fill px-2 py-px text-eyebrow font-medium text-text-faint">
      {messages.subjectsArchived}
    </span>
  );
}

type RecordProgressProps = {
  choices: readonly RecordChoice[];
  onOpenRecord: OpenRecord;
  className?: string;
  children: ReactNode;
};

export function RecordProgress({
  choices,
  onOpenRecord,
  className,
  children,
}: RecordProgressProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const many = choices.length > 1;

  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [position]);

  const onClick = () => {
    const button = buttonRef.current;
    if (!button) return;
    if (!many) {
      onOpenRecord(choices[0].recordId, button);
      return;
    }
    if (position) {
      setPosition(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const height = choices.length * CHOOSER_ROW_HEIGHT + 12;
    const placed = placeFloating(rect, CHOOSER_WIDTH, height, viewport);
    setPosition({
      left: Math.max(
        EDGE,
        Math.min(rect.right - CHOOSER_WIDTH, viewport.width - CHOOSER_WIDTH - EDGE),
      ),
      top: placed.top ?? rect.top - EDGE - height,
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={messages.planViewRecords}
        aria-haspopup={many ? "true" : undefined}
        aria-expanded={many ? position !== null : undefined}
        onClick={onClick}
        className={className}
      >
        {children}
      </button>
      {position
        ? createPortal(
            <div
              className="fixed z-[var(--z-float)]"
              style={{ left: position.left, top: position.top }}
            >
              <div className="relative">
                <RecordChooser
                  choices={choices}
                  triggerRef={buttonRef}
                  onClose={() => setPosition(null)}
                  onChoose={(recordId) => {
                    setPosition(null);
                    onOpenRecord(recordId, buttonRef.current ?? document.body);
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

type PlanRowProps = {
  block: BlockResponse;
  lookup: PlanLookup;
  past: boolean;
  canStart: boolean;
  starting: boolean;
  records: readonly RecordChoice[];
  startClock: string | null;
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
  onStart: (blockId: string) => void;
};

const detailClass =
  "num block min-w-[140px] whitespace-nowrap text-right text-small text-text-soft";
const mainClass =
  "-mx-2 -my-1.5 flex min-w-0 flex-1 items-center gap-3.5 rounded-row px-2 py-1.5 text-left hover:bg-fill";

export function PlanRow({
  block,
  lookup,
  past,
  canStart,
  starting,
  records,
  startClock,
  onOpen,
  onOpenRecord,
  onStart,
}: PlanRowProps) {
  const { info, archived } = lookupSubject(lookup, block.nodeId);
  const path = formatPath(info.ancestors);

  const summary = (
    <>
      <span className="num w-11 shrink-0 text-small text-text-faint">
        {block.timeOfDay ?? startClock ?? ""}
      </span>
      <Swatch color={info.color} className={cn(archived && "opacity-60 grayscale")} />
      <span className="block min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold">
          <span title={info.name} className="truncate">
            {info.name}
          </span>
          {archived ? <ArchivedTag /> : null}
        </span>
        {path ? (
          <span title={path} className="block truncate text-caption text-text-faint">
            {path}
          </span>
        ) : null}
      </span>
    </>
  );
  const detailText = past
    ? blockProgressText(block)
    : block.plannedMinutes
      ? messages.planMinutes(String(block.plannedMinutes))
      : messages.planOpen;
  const detailBar =
    past && block.plannedMinutes ? (
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-fill">
        <i
          className="block h-full rounded-full"
          style={{
            width: `${progressFill(block.plannedMinutes, block.progressSeconds)}%`,
            background: info.color,
          }}
        />
      </span>
    ) : null;

  return (
    <li className="relative flex items-center gap-3.5 border-t border-border py-3.5 first:border-t-0 first:pt-0">
      {past && records.length > 1 ? (
        <div className={mainClass}>
          <button
            type="button"
            onClick={(event) => onOpen(block, event.currentTarget)}
            className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
          >
            {summary}
          </button>
          <div className={detailClass}>
            <RecordProgress
              choices={records}
              onOpenRecord={onOpenRecord}
              className="rounded-row underline decoration-dotted underline-offset-2 hover:text-text"
            >
              {detailText}
            </RecordProgress>
            {detailBar}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={(event) => onOpen(block, event.currentTarget)}
          className={mainClass}
        >
          {summary}
          <span className={detailClass}>
            {detailText}
            {detailBar}
          </span>
        </button>
      )}
      {canStart ? (
        <IconButton
          variant="tint"
          label={messages.todayStart}
          disabled={starting}
          onClick={() => onStart(block.id)}
        >
          <PlayIcon />
        </IconButton>
      ) : null}
    </li>
  );
}

type PlanGhostRowProps = {
  record: SessionResponse;
  lookup: PlanLookup;
  timeZone: string;
  onOpenRecord: OpenRecord;
};

export function PlanGhostRow({ record, lookup, timeZone, onOpenRecord }: PlanGhostRowProps) {
  if (!record.nodeId) return null;
  const { info, archived } = lookupSubject(lookup, record.nodeId);
  const path = formatPath(info.ancestors);
  const start = formatClock(new Date(record.startedAt), timeZone);
  const end = record.endedAt ? formatClock(new Date(record.endedAt), timeZone) : "";

  return (
    <li className="py-1.5 first:pt-0">
      <button
        type="button"
        title={`${info.name} · ${start}–${end}`}
        onClick={(event) => onOpenRecord(record.id, event.currentTarget)}
        className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3.5 rounded-row border-[1.5px] border-dashed border-[color-mix(in_srgb,var(--text-faint)_55%,transparent)] px-2 py-2.5 text-left hover:bg-fill"
      >
        <span className="num w-11 shrink-0 text-small text-text-faint">{start}</span>
        <Swatch color={info.color} className={cn(archived && "opacity-60 grayscale")} />
        <span className="block min-w-0 flex-1">
          <span className="flex items-center gap-2 font-semibold">
            <span title={info.name} className="truncate">
              {info.name}
            </span>
            {archived ? <ArchivedTag /> : null}
          </span>
          {path ? (
            <span title={path} className="block truncate text-caption text-text-faint">
              {path}
            </span>
          ) : null}
        </span>
        <span className={detailClass}>{formatSeconds(record.activeSeconds)}</span>
      </button>
    </li>
  );
}

type PlanEventRowProps = {
  event: EventSummaryResponse;
  lookup: PlanLookup;
  spacer?: boolean;
};

export function PlanEventRow({ event, lookup, spacer }: PlanEventRowProps) {
  const covered = eventSubjects(event, lookup)
    .map(({ info }) => info.name)
    .join(", ");

  return (
    <li className="py-1.5 first:pt-0">
      <div className="-mx-2 flex items-center gap-3.5 rounded-row bg-fill px-2 py-2.5">
        <span className="num w-11 shrink-0 text-small text-text-faint">{event.time ?? ""}</span>
        <span
          aria-hidden="true"
          className="mx-[3.5px] w-[3px] shrink-0 self-stretch rounded-full bg-text-faint"
        />
        <span className="block min-w-0 flex-1">
          <span title={event.title} className="block truncate font-semibold">
            {event.title}
          </span>
          {covered ? (
            <span title={covered} className="block truncate text-caption text-text-faint">
              {covered}
            </span>
          ) : null}
        </span>
        <span className={detailClass}>
          {event.state === "closed" ? messages.planEventClosed : ""}
        </span>
        {spacer ? <span aria-hidden="true" className="size-11 shrink-0" /> : null}
      </div>
    </li>
  );
}
