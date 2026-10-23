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
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
  onStart: (blockId: string) => void;
};

const detailClass =
  "num block min-w-[104px] whitespace-nowrap text-right text-small text-text-soft";
const mainClass =
  "-mx-2 -my-1.5 flex min-w-0 flex-1 items-center gap-3.5 rounded-row px-2 py-1.5 text-left hover:bg-fill";

export function PlanRow({
  block,
  lookup,
  past,
  canStart,
  starting,
  records,
  onOpen,
  onOpenRecord,
  onStart,
}: PlanRowProps) {
  const { info, archived } = lookupSubject(lookup, block.nodeId);
  const path = formatPath(info.ancestors);

  const summary = (
    <>
      <span className="num w-11 shrink-0 text-small text-text-faint">{block.timeOfDay ?? ""}</span>
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
  const detail = (
    <>
      {past
        ? blockProgressText(block)
        : block.plannedMinutes
          ? messages.planMinutes(String(block.plannedMinutes))
          : messages.planOpen}
      {past && block.plannedMinutes ? (
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-fill">
          <i
            className="block h-full rounded-full"
            style={{
              width: `${progressFill(block.plannedMinutes, block.progressSeconds)}%`,
              background: info.color,
            }}
          />
        </span>
      ) : null}
    </>
  );

  return (
    <li className="relative flex items-center gap-3.5 border-t border-border py-3.5 first:border-t-0 first:pt-0">
      {past && records.length > 0 ? (
        <div className={mainClass}>
          <button
            type="button"
            onClick={(event) => onOpen(block, event.currentTarget)}
            className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
          >
            {summary}
          </button>
          <RecordProgress
            choices={records}
            onOpenRecord={onOpenRecord}
            className={cn(detailClass, "rounded-row px-2 py-1 hover:bg-fill-hover")}
          >
            {detail}
          </RecordProgress>
        </div>
      ) : (
        <button
          type="button"
          onClick={(event) => onOpen(block, event.currentTarget)}
          className={mainClass}
        >
          {summary}
          <span className={detailClass}>{detail}</span>
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
      ) : (
        <span aria-hidden="true" className="size-11 shrink-0" />
      )}
    </li>
  );
}
