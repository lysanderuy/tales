import { CardHeader } from "@/components/shared/card-header";
import { Card } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { chartScaleMinutes, segmentHeightPx } from "@/lib/today/chart";
import { formatDayLabel, formatHoursLabel, formatSeconds } from "@/lib/today/format";
import { resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";
import type { TodayResponse } from "@/validators/today.validator";

type PastSevenDaysCardProps = {
  todayDate: TodayResponse["todayDate"];
  days: TodayResponse["past7Days"];
  index: SubjectIndex;
  className?: string;
};

export function PastSevenDaysCard({ todayDate, days, index, className }: PastSevenDaysCardProps) {
  const scale = chartScaleMinutes(days.map((day) => day.totalSeconds));

  const legend: ReturnType<typeof resolveSubject>[] = [];
  for (const day of days) {
    for (const entry of day.bySubject) {
      if (entry.seconds <= 0 || legend.some((subject) => subject.id === entry.rootId)) continue;
      legend.push(resolveSubject(index, entry.rootId, messages.todayUnknownSubject));
    }
  }

  return (
    <Card className={className}>
      <CardHeader title={messages.todayPast7Days} eyebrow={messages.todayHoursPerDay} />
      <div className="flex h-[200px] items-end gap-3 pt-2">
        {days.map((day) => {
          const segments = day.bySubject.filter((entry) => entry.seconds > 0);
          return (
            <div
              key={day.date}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="num min-h-4 text-eyebrow text-text-faint">
                {formatHoursLabel(day.totalSeconds)}
              </div>
              {segments.length === 0 ? (
                <div className="h-0.5 w-full max-w-[40px] rounded-[2px] bg-border" />
              ) : (
                <div className="flex w-full max-w-[40px] flex-col-reverse gap-0.5">
                  {segments.map((entry) => {
                    const subject = resolveSubject(
                      index,
                      entry.rootId,
                      messages.todayUnknownSubject,
                    );
                    return (
                      <span
                        key={entry.rootId}
                        title={`${subject.name} ${formatSeconds(entry.seconds)}`}
                        className="block w-full rounded-md"
                        style={{
                          height: segmentHeightPx(entry.seconds, scale),
                          background: subject.color,
                        }}
                      />
                    );
                  })}
                </div>
              )}
              <div
                className={cn(
                  "whitespace-nowrap text-eyebrow",
                  day.date === todayDate ? "font-semibold text-primary" : "text-text-soft",
                )}
              >
                {formatDayLabel(day.date)}
              </div>
            </div>
          );
        })}
      </div>
      {legend.length > 0 ? (
        <ul className="mt-[18px] flex flex-wrap gap-x-[18px] gap-y-1.5 text-caption text-text-soft">
          {legend.map((subject) => (
            <li key={subject.id} className="inline-flex items-center gap-1.5">
              <Swatch color={subject.color} />
              {subject.name}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
