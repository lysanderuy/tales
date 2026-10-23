import { PlanTotal } from "@/components/shared/plan-summary";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { formatDayTitle, formatWeekdayShort } from "@/lib/plan/dates";
import { chartBarHeight, daySegments, plannedTotal, type RootOf } from "@/lib/plan/summary";
import { formatMinutes } from "@/lib/today/format";
import type { SubjectIndex } from "@/lib/today/subject-index";
import type { BlockResponse } from "@/validators/block.validator";

type PlanWeekChartProps = {
  days: readonly string[];
  selected: string;
  blocks: readonly BlockResponse[];
  index: SubjectIndex;
  onPick: (date: string) => void;
};

export function PlanWeekChart({ days, selected, blocks, index, onPick }: PlanWeekChartProps) {
  const rootOf: RootOf = (nodeId) => index.get(nodeId)?.rootId ?? null;
  const perDay = days.map((date) => {
    const dayBlocks = blocks.filter((block) => block.date === date);
    return { date, blocks: dayBlocks, total: plannedTotal(dayBlocks) };
  });
  const maxTotal = Math.max(1, ...perDay.map((day) => day.total));
  const weekTotal = perDay.reduce((sum, day) => sum + day.total, 0);
  const selectedDay = perDay.find((day) => day.date === selected);

  return (
    <Card>
      <Eyebrow as="div">{messages.planThisWeek}</Eyebrow>
      {weekTotal > 0 ? (
        <PlanTotal minutes={weekTotal} small />
      ) : (
        <div className="mt-2 text-h2 leading-[1.3] tracking-[-0.01em] text-text-faint">
          {messages.planNothingPlanned}
        </div>
      )}
      <div className="mt-[18px] grid grid-cols-7 items-end gap-1">
        {perDay.map((day) => {
          const label = `${formatDayTitle(day.date)} · ${
            day.total > 0 ? formatMinutes(day.total) : messages.planNothingPlanned
          }`;
          const segments = daySegments(day.blocks, rootOf);
          return (
            <button
              key={day.date}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={day.date === selected}
              onClick={() => onPick(day.date)}
              className="group flex flex-col items-center gap-2 rounded-field py-0.5"
            >
              <span className="flex h-16 w-full items-end justify-center">
                {day.total > 0 ? (
                  <span
                    className="flex w-full max-w-7 flex-col gap-0.5 overflow-hidden rounded-[6px]"
                    style={{ height: chartBarHeight(day.total, maxTotal) }}
                  >
                    {segments.map((segment) => (
                      <i
                        key={segment.rootId}
                        className="block min-h-[3px]"
                        style={{
                          flex: segment.minutes,
                          background: index.get(segment.rootId)?.color ?? "var(--border)",
                        }}
                      />
                    ))}
                  </span>
                ) : (
                  <span className="block h-0.5 w-full max-w-7 rounded-[2px] bg-border" />
                )}
              </span>
              <span
                className={cn(
                  "flex size-[26px] items-center justify-center rounded-full text-caption group-hover:bg-fill",
                  day.date === selected
                    ? "bg-primary-soft font-medium text-primary"
                    : "text-text-soft",
                )}
              >
                {formatWeekdayShort(day.date).charAt(0)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="num mt-3 text-small text-text-soft">
        {formatDayTitle(selected)} ·{" "}
        {selectedDay && selectedDay.blocks.length > 0
          ? formatMinutes(selectedDay.total)
          : messages.planNothingPlanned}
      </div>
    </Card>
  );
}
