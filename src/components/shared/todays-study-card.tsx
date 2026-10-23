"use client";

import { useRef, useState, type ReactNode } from "react";

import { CardHeader } from "@/components/shared/card-header";
import { PlayIcon } from "@/components/shared/icons";
import { RecordChooser, type RecordChoice } from "@/components/shared/record-chooser";
import { EditRecordDialog } from "@/components/shared/edit-record-dialog";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Swatch } from "@/components/ui/swatch";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useOpenFocus } from "@/hooks/use-open-focus";
import { useStartBlock } from "@/hooks/use-start-block";
import { useStartSession } from "@/hooks/use-start-session";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { unlockAudio } from "@/lib/sound/chime";
import {
  formatProgress,
  formatSeconds,
  formatTimeRanges,
  progressPercent,
} from "@/lib/today/format";
import {
  formatPath,
  resolveSubject,
  type SubjectIndex,
  type SubjectInfo,
} from "@/lib/today/subject-index";
import type { TodayResponse } from "@/validators/today.validator";

type TodayRow = TodayResponse["rows"][number];

type TodaysStudyCardProps = {
  rows: TodayResponse["rows"];
  index: SubjectIndex;
  className?: string;
};

type RowView = {
  key: string;
  timeOfDay: string;
  subject: SubjectInfo | null;
  times: string;
  progress: string;
  bar: { percent: number } | null;
  live: boolean;
  records: RecordChoice[];
  start: { blockId: string } | { nodeId: string } | null;
};

function toRowView(row: TodayRow, index: SubjectIndex): RowView {
  if (row.kind === "planned") {
    return {
      key: row.blockId,
      timeOfDay: row.timeOfDay ?? "",
      subject: resolveSubject(index, row.nodeId, messages.todayUnknownSubject),
      times: formatTimeRanges(row.records, messages.todayRunningEnd),
      progress: formatProgress(row.plannedMinutes, row.progressSeconds),
      bar:
        row.plannedMinutes && row.plannedMinutes > 0
          ? { percent: progressPercent(row.plannedMinutes, row.progressSeconds) }
          : null,
      live: row.live,
      records: row.records
        .filter((record) => !record.live)
        .map((record) => ({
          recordId: record.recordId,
          label: `${record.startClock}–${record.endClock ?? messages.todayRunningEnd} · ${formatSeconds(record.seconds)}`,
        })),
      start: { blockId: row.blockId },
    };
  }

  const duration = formatSeconds(row.seconds);
  return {
    key: row.recordId,
    timeOfDay: "",
    subject: row.nodeId ? resolveSubject(index, row.nodeId, messages.todayUnknownSubject) : null,
    times: "",
    progress: row.live
      ? duration
      : `${duration} · ${row.startClock}–${row.endClock ?? messages.todayRunningEnd}`,
    bar: null,
    live: row.live,
    records: row.live ? [] : [{ recordId: row.recordId, label: duration }],
    start: row.nodeId ? { nodeId: row.nodeId } : null,
  };
}

type StudyRowMainProps = {
  records: RecordChoice[];
  onOpen: (recordId: string, opener: HTMLElement | null) => void;
  children: ReactNode;
};

const mainClass = "flex min-w-0 flex-1 items-center gap-3.5";

function StudyRowMain({ records, onOpen, children }: StudyRowMainProps) {
  const [chooserOpen, setChooserOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (records.length === 0) return <div className={mainClass}>{children}</div>;

  const [only] = records;
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup={records.length > 1 ? "true" : undefined}
        aria-expanded={records.length > 1 ? chooserOpen : undefined}
        onClick={() => {
          if (records.length === 1) onOpen(only.recordId, buttonRef.current);
          else setChooserOpen((value) => !value);
        }}
        className={cn(mainClass, "-mx-2 -my-1.5 rounded-row px-2 py-1.5 text-left hover:bg-fill")}
      >
        {children}
      </button>
      {chooserOpen ? (
        <RecordChooser
          choices={records}
          triggerRef={buttonRef}
          onClose={() => setChooserOpen(false)}
          onChoose={(recordId) => {
            setChooserOpen(false);
            onOpen(recordId, buttonRef.current);
          }}
        />
      ) : null}
    </>
  );
}

export function TodaysStudyCard({ rows, index, className }: TodaysStudyCardProps) {
  const views = rows.map((row) => toRowView(row, index));
  const { session, display } = useSessionClock();
  const startBlock = useStartBlock();
  const startSession = useStartSession();
  const openFocus = useOpenFocus();
  const starting = startBlock.isPending || startSession.isPending;
  const [editing, setEditing] = useState<{ id: string; opener: HTMLElement | null } | null>(null);

  const play = (start: NonNullable<RowView["start"]>) => {
    unlockAudio();
    if ("blockId" in start) startBlock.mutate({ blockId: start.blockId }, { onSuccess: openFocus });
    else {
      startSession.mutate({ nodeId: start.nodeId, startedFrom: "free" }, { onSuccess: openFocus });
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader title={messages.todayTodaysStudy} />
        {views.length === 0 ? (
          <p className="py-1 text-ui text-text-faint">{messages.todayEmpty}</p>
        ) : (
          <ul>
            {views.map((view) => {
              const color = view.subject?.color ?? "var(--border)";
              const path = view.subject ? formatPath(view.subject.ancestors) : "";
              return (
                <li
                  key={view.key}
                  className="relative flex items-center gap-3.5 border-t border-border py-3.5 first:border-t-0 first:pt-0"
                >
                  <StudyRowMain
                    records={view.records}
                    onOpen={(id, opener) => setEditing({ id, opener })}
                  >
                    <span className="num w-11 shrink-0 text-small text-text-faint">
                      {view.timeOfDay}
                    </span>
                    <Swatch color={color} />
                    <span className="block min-w-0 flex-1">
                      <span
                        className={cn(
                          "flex items-center gap-2",
                          view.subject ? "font-semibold" : "font-medium text-text-faint",
                        )}
                      >
                        <span title={view.subject?.name} className="truncate">
                          {view.subject
                            ? view.subject.name
                            : view.live
                              ? messages.todayWhatStudying
                              : messages.todayWhatStudied}
                        </span>
                        {view.live ? (
                          <span
                            aria-hidden="true"
                            className="size-[7px] shrink-0 rounded-full bg-primary"
                          />
                        ) : null}
                      </span>
                      {path ? (
                        <span title={path} className="block truncate text-caption text-text-faint">
                          {path}
                        </span>
                      ) : null}
                      {view.times ? (
                        <span className="num block truncate text-caption text-text-faint">
                          {view.times}
                        </span>
                      ) : null}
                    </span>
                    <span className="num block min-w-[104px] whitespace-nowrap text-right text-small text-text-soft">
                      {view.live && display ? display.text : view.progress}
                      {view.bar ? (
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-fill">
                          <i
                            className="block h-full rounded-full"
                            style={{ width: `${view.bar.percent}%`, background: color }}
                          />
                        </span>
                      ) : null}
                    </span>
                  </StudyRowMain>
                  {view.start && !session ? (
                    <IconButton
                      variant="tint"
                      label={messages.todayStart}
                      disabled={starting}
                      onClick={() => play(view.start!)}
                    >
                      <PlayIcon />
                    </IconButton>
                  ) : (
                    <span aria-hidden="true" className="size-11 shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {editing ? (
        <EditRecordDialog
          recordId={editing.id}
          opener={editing.opener}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
