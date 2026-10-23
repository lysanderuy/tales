import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import {
  barPercent,
  plannedTotal,
  studiedTotalSeconds,
  summarizeByRoot,
  type SummaryBlock,
  type SummaryRecord,
} from "@/lib/plan/summary";
import { formatMinutes, formatSeconds } from "@/lib/today/format";
import { resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";

type PlanSummaryProps = {
  title: string;
  blocks: readonly SummaryBlock[];
  studied: readonly SummaryRecord[] | null;
  index: SubjectIndex;
  wide?: boolean;
  className?: string;
};

export function PlanTotal({ minutes, small }: { minutes: number; small: boolean }) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const unit = "ml-[0.12em] mr-[0.35em] text-body tracking-normal text-text-faint";
  return (
    <div
      className={cn(
        "num leading-none tracking-[-0.03em] text-time",
        small ? "mt-1.5 text-[28px]" : "mb-4 mt-2 text-total",
      )}
    >
      {hours > 0 ? (
        <>
          {hours}
          <small className={unit}>h</small>
          {rest > 0 ? (
            <>
              {rest}
              <small className={unit}>min</small>
            </>
          ) : null}
        </>
      ) : (
        <>
          {rest}
          <small className={unit}>min</small>
        </>
      )}
    </div>
  );
}

export function PlanSummary({
  title,
  blocks,
  studied,
  index,
  wide = false,
  className,
}: PlanSummaryProps) {
  const past = studied !== null;
  const totals = summarizeByRoot(
    blocks,
    studied ?? [],
    (nodeId) => index.get(nodeId)?.rootId ?? null,
  );
  const planned = plannedTotal(blocks);
  const maxMinutes = Math.max(
    1,
    ...totals.map((total) => Math.max(total.plannedMinutes, total.studiedSeconds / 60)),
  );

  if (totals.length === 0) {
    return (
      <Card className={className}>
        <Eyebrow as="div">{title}</Eyebrow>
        <div className="mt-2 text-h2 leading-[1.3] tracking-[-0.01em] text-text-faint">
          {messages.planNothingPlanned}
        </div>
      </Card>
    );
  }

  const heading =
    planned > 0 ? (
      <PlanTotal minutes={planned} small={wide} />
    ) : (
      <div className="mb-4 mt-2 text-h2 leading-[1.3] tracking-[-0.01em] text-text-faint">
        {blocks.length > 0 ? messages.planAllOpen : messages.planNothingPlanned}
      </div>
    );

  const rows = (
    <ul
      className={cn(
        "flex flex-col gap-3.5",
        wide
          ? "grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-12 gap-y-4 max-[900px]:grid-cols-1"
          : "mt-[18px]",
      )}
    >
      {totals.map((total) => {
        const root = resolveSubject(index, total.rootId, messages.todayUnknownSubject);
        const studiedSeconds = total.studiedSeconds;
        const main = past
          ? total.plannedMinutes > 0
            ? `${formatSeconds(studiedSeconds)} of ${formatMinutes(total.plannedMinutes)}`
            : formatSeconds(studiedSeconds)
          : total.plannedMinutes > 0
            ? formatMinutes(total.plannedMinutes)
            : "";
        const meta = [
          main,
          total.openCount > 0 ? messages.planOpenCount(String(total.openCount)) : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <li key={total.rootId}>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-ui">
              <Swatch color={root.color} />
              <span className="min-w-0 flex-[1_1_140px] truncate" title={root.name}>
                {root.name}
              </span>
              <span className="num ml-auto shrink-0 whitespace-nowrap text-small text-text-soft">
                {meta}
              </span>
            </div>
            <div className="relative ml-5 mt-1.5 h-1 overflow-hidden rounded-full bg-fill">
              <i
                className={cn("absolute left-0 top-0 h-full rounded-full", past && "opacity-40")}
                style={{
                  width: `${barPercent(total.plannedMinutes, maxMinutes)}%`,
                  background: root.color,
                }}
              />
              {past ? (
                <i
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${barPercent(studiedSeconds / 60, maxMinutes)}%`,
                    background: root.color,
                  }}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <Card className={className}>
      {wide ? (
        <div className="grid grid-cols-[minmax(160px,220px)_1fr] items-start gap-x-10 gap-y-6 max-[900px]:grid-cols-1">
          <div>
            <Eyebrow as="div">{title}</Eyebrow>
            {heading}
          </div>
          {rows}
        </div>
      ) : (
        <>
          <Eyebrow as="div">{title}</Eyebrow>
          {heading}
          {past ? (
            <div className="-mt-1.5 mb-0.5 text-ui text-text-soft">
              {messages.planStudied}{" "}
              <span className="num">{formatSeconds(studiedTotalSeconds(totals))}</span>
            </div>
          ) : null}
          {rows}
        </>
      )}
    </Card>
  );
}
