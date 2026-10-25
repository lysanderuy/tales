"use client";

import { useMemo } from "react";

import { CardHeader } from "@/components/shared/card-header";
import {
  PlanEventRow,
  PlanGhostRow,
  PlanRow,
  recordChoicesByBlock,
  type OpenRecord,
  type PlanLookup,
} from "@/components/shared/plan-row";
import { PlanSummary } from "@/components/shared/plan-summary";
import { PlanWeekChart } from "@/components/shared/plan-week-chart";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { BAND_LABELS, bandOf, firstStartClock, groupIntoBands } from "@/lib/plan/bands";
import { dayDiff } from "@/lib/plan/dates";
import { formatClock, localDateKey } from "@/lib/time/zone";
import type { BlockResponse } from "@/validators/block.validator";
import type { EventSummaryResponse } from "@/validators/event.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

type PlanDayViewProps = {
  date: string;
  today: string;
  weekDays: readonly string[];
  weekBlocks: readonly BlockResponse[];
  events: readonly EventSummaryResponse[];
  records: readonly SessionResponse[];
  lookup: PlanLookup;
  timeZone: string;
  canStart: boolean;
  starting: boolean;
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
  onStart: (blockId: string) => void;
  onPickDay: (date: string) => void;
};

type DayItem =
  | { kind: "block"; block: BlockResponse }
  | { kind: "ghost"; record: SessionResponse }
  | { kind: "event"; event: EventSummaryResponse };

function studyTitle(date: string, today: string): string {
  const diff = dayDiff(today, date);
  if (diff === 0) return messages.planStudyToday;
  if (diff === 1) return messages.planStudyTomorrow;
  if (diff === -1) return messages.planStudyYesterday;
  return messages.planStudyOther;
}

export function PlanDayView({
  date,
  today,
  weekDays,
  weekBlocks,
  events,
  records,
  lookup,
  timeZone,
  canStart,
  starting,
  onOpen,
  onOpenRecord,
  onStart,
  onPickDay,
}: PlanDayViewProps) {
  const past = date <= today;
  const dayBlocks = useMemo(
    () => weekBlocks.filter((block) => block.date === date),
    [weekBlocks, date],
  );
  const dayEvents = events.filter((event) => event.date === date);
  const dayRecords = useMemo(
    () => records.filter((record) => localDateKey(new Date(record.startedAt), timeZone) === date),
    [records, date, timeZone],
  );
  const choicesByBlock = useMemo(
    () => recordChoicesByBlock(records, timeZone),
    [records, timeZone],
  );
  const sessionsByBlock = useMemo(() => {
    const byBlock = new Map<string, SessionResponse[]>();
    const sorted = [...records].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    for (const record of sorted) {
      if (record.blockId === null || record.endedAt === null) continue;
      byBlock.set(record.blockId, [...(byBlock.get(record.blockId) ?? []), record]);
    }
    return byBlock;
  }, [records]);
  const currentBand = useMemo(() => bandOf(formatClock(new Date(), timeZone)), [timeZone]);
  const untimedEvents = dayEvents.filter((event) => event.time === null);
  const items: DayItem[] = [
    ...dayEvents
      .filter((event) => event.time !== null)
      .map((event): DayItem => ({ kind: "event", event })),
    ...dayBlocks.map((block): DayItem => ({ kind: "block", block })),
    ...(past
      ? dayRecords
          .filter((record) => record.blockId === null && record.nodeId !== null)
          .map((record): DayItem => ({ kind: "ghost", record }))
      : []),
  ];
  const groups = groupIntoBands(
    items,
    (item) => {
      if (item.kind === "event") return item.event.time;
      return item.kind === "block"
        ? (item.block.timeOfDay ?? firstStartClock(sessionsByBlock.get(item.block.id), timeZone))
        : formatClock(new Date(item.record.startedAt), timeZone);
    },
    (item) => {
      if (item.kind === "event") return -1;
      return item.kind === "block" ? item.block.position : Number.MAX_SAFE_INTEGER;
    },
  );
  const studied = past
    ? dayRecords.map((record) => ({ nodeId: record.nodeId, seconds: record.activeSeconds }))
    : null;

  const empty = dayBlocks.length === 0 && dayEvents.length === 0;

  return (
    <div className="grid grid-cols-12 items-start gap-4">
      <Card className="col-span-12 min-[900px]:col-span-8">
        <CardHeader title={studyTitle(date, today)} />
        {untimedEvents.length > 0 ? (
          <ul className="mb-5">
            {untimedEvents.map((event) => (
              <PlanEventRow key={event.id} event={event} lookup={lookup} />
            ))}
          </ul>
        ) : null}
        {empty ? (
          <p className="py-1 text-ui text-text-faint">{messages.planEmptyDay}</p>
        ) : (
          groups.map((group, index) => (
            <div key={group.band} className={index > 0 ? "mt-5" : undefined}>
              <Eyebrow
                as="div"
                className={cn(
                  "mb-3",
                  date === today && group.band === currentBand && "text-primary",
                )}
              >
                {BAND_LABELS[group.band]}
              </Eyebrow>
              <ul>
                {group.items.map((item) => {
                  if (item.kind === "event") {
                    return <PlanEventRow key={item.event.id} event={item.event} lookup={lookup} />;
                  }
                  return item.kind === "block" ? (
                    <PlanRow
                      key={item.block.id}
                      block={item.block}
                      lookup={lookup}
                      past={past}
                      canStart={canStart}
                      starting={starting}
                      records={choicesByBlock.get(item.block.id) ?? []}
                      startClock={
                        item.block.timeOfDay
                          ? null
                          : firstStartClock(sessionsByBlock.get(item.block.id), timeZone)
                      }
                      onOpen={onOpen}
                      onOpenRecord={onOpenRecord}
                      onStart={onStart}
                    />
                  ) : (
                    <PlanGhostRow
                      key={item.record.id}
                      record={item.record}
                      lookup={lookup}
                      timeZone={timeZone}
                      onOpenRecord={onOpenRecord}
                    />
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </Card>
      <div className="col-span-12 flex flex-col gap-4 min-[900px]:sticky min-[900px]:top-[88px] min-[900px]:col-span-4">
        <PlanWeekChart
          days={weekDays}
          selected={date}
          blocks={weekBlocks}
          index={lookup.index}
          onPick={onPickDay}
        />
        <PlanSummary
          title={messages.planPlanned}
          blocks={dayBlocks}
          studied={studied}
          index={lookup.index}
        />
      </div>
    </div>
  );
}
