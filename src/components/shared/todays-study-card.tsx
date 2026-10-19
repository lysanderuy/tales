import { CardHeader } from "@/components/shared/card-header";
import { Card } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
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
  subject: SubjectInfo | null;
  times: string;
  progress: string;
  bar: { percent: number } | null;
  live: boolean;
};

function toRowView(row: TodayRow, index: SubjectIndex): RowView {
  if (row.kind === "planned") {
    return {
      key: row.blockId,
      subject: resolveSubject(index, row.nodeId, messages.todayUnknownSubject),
      times: formatTimeRanges(row.times, messages.todayRunningEnd),
      progress: formatProgress(row.plannedMinutes, row.progressSeconds),
      bar:
        row.plannedMinutes && row.plannedMinutes > 0
          ? { percent: progressPercent(row.plannedMinutes, row.progressSeconds) }
          : null,
      live: row.live,
    };
  }

  const duration = formatSeconds(row.seconds);
  return {
    key: row.recordId,
    subject: row.nodeId ? resolveSubject(index, row.nodeId, messages.todayUnknownSubject) : null,
    times: "",
    progress: row.live
      ? duration
      : `${duration} · ${row.startClock}–${row.endClock ?? messages.todayRunningEnd}`,
    bar: null,
    live: row.live,
  };
}

export function TodaysStudyCard({ rows, index, className }: TodaysStudyCardProps) {
  const views = rows.map((row) => toRowView(row, index));

  return (
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
                className="flex items-center gap-3.5 border-t border-border py-3.5 first:border-t-0 first:pt-0"
              >
                <Swatch color={color} />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      view.subject ? "font-semibold" : "font-medium text-text-faint",
                    )}
                  >
                    <span className="truncate">
                      {view.subject ? view.subject.name : messages.todayWhatStudying}
                    </span>
                    {view.live ? (
                      <span
                        aria-hidden="true"
                        className="size-[7px] shrink-0 rounded-full bg-primary"
                      />
                    ) : null}
                  </div>
                  {path ? (
                    <div className="truncate text-caption text-text-faint">{path}</div>
                  ) : null}
                  {view.times ? (
                    <div className="num truncate text-caption text-text-faint">{view.times}</div>
                  ) : null}
                </div>
                <div className="num min-w-[104px] whitespace-nowrap text-right text-small text-text-soft">
                  {view.progress}
                  {view.bar ? (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fill">
                      <i
                        className="block h-full rounded-full"
                        style={{ width: `${view.bar.percent}%`, background: color }}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
