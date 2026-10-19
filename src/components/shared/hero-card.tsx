import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { formatEventSub } from "@/lib/today/format";
import type { HeroState } from "@/lib/today/hero";
import type { TodayResponse } from "@/validators/today.validator";

type NextEvent = NonNullable<TodayResponse["nextEvent"]>;

const leadClass = "mt-4 max-w-[28ch] text-h1 font-normal leading-tight tracking-[-0.02em]";

export function HeroCard({ hero, className }: { hero: HeroState<NextEvent>; className?: string }) {
  const { boards, lead, line, event } = hero;
  const hasLeft = boards !== null || lead !== null;

  return (
    <section
      className={cn(
        "flex min-h-[220px] flex-col justify-between rounded-card bg-hero p-6 text-on-hero",
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap justify-between gap-6">
        {boards?.kind === "days" ? (
          <div>
            <Eyebrow className="text-on-hero-soft">{messages.todayBoards}</Eyebrow>
            <div className="num mt-4 text-[length:var(--fs-hero)] font-normal leading-none tracking-[-0.03em]">
              {boards.days}
              <small className="ml-2.5 text-h2 font-normal tracking-normal text-on-hero-soft">
                {boards.days === 1 ? messages.todayDayToBoards : messages.todayDaysToBoards}
              </small>
            </div>
          </div>
        ) : null}
        {boards?.kind === "today" ? (
          <div>
            <Eyebrow className="text-on-hero-soft">{messages.todayBoards}</Eyebrow>
            <p className={leadClass}>{messages.todayBoardsToday}</p>
          </div>
        ) : null}
        {lead ? <p className={cn(leadClass, "self-start")}>{lead}</p> : null}
        {event ? (
          <div
            className={cn(
              "min-w-[190px] max-w-[250px] self-start",
              hasLeft && "border-l border-on-hero-line pl-6",
            )}
          >
            <Eyebrow className="text-on-hero-soft">{messages.todayNextEvent}</Eyebrow>
            <p className="mt-4 line-clamp-2 text-h2 font-semibold leading-[1.2] tracking-[-0.01em]">
              {event.title}
            </p>
            <p className="mt-1.5 text-ui text-on-hero-soft">{formatEventSub(event)}</p>
          </div>
        ) : null}
      </div>
      {line ? <p className="mt-6 max-w-[40ch] text-ui text-on-hero-soft">{line}</p> : null}
    </section>
  );
}
