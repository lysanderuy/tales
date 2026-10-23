"use client";

import { useMemo } from "react";

import { CardHeader } from "@/components/shared/card-header";
import {
  PlanRow,
  lookupSubject,
  recordChoicesByBlock,
  type OpenRecord,
  type PlanLookup,
} from "@/components/shared/plan-row";
import { PlanSummary } from "@/components/shared/plan-summary";
import { PlanWeekChart } from "@/components/shared/plan-week-chart";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Swatch } from "@/components/ui/swatch";
import { messages } from "@/lib/messages";
import { dayDiff } from "@/lib/plan/dates";
import { formatClock, localDateKey } from "@/lib/time/zone";
import { formatPath } from "@/lib/today/subject-index";
import { formatSeconds } from "@/lib/today/format";
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
  const unlinked = past
    ? dayRecords
        .filter((record) => record.blockId === null && record.nodeId !== null)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    : [];
  const studied = past
    ? dayRecords.map((record) => ({ nodeId: record.nodeId, seconds: record.activeSeconds }))
    : null;

  const empty = dayBlocks.length === 0;

  return (
    <div className="grid grid-cols-12 items-start gap-4">
      <Card className="col-span-12 min-[900px]:col-span-8">
        <CardHeader title={studyTitle(date, today)} />
        {dayEvents.length > 0 ? (
          <div className="-mt-1 mb-4 flex flex-wrap items-center gap-2">
            <Eyebrow>{messages.planEvent}</Eyebrow>
            {dayEvents.map((event) => (
              <span
                key={event.id}
                className="num rounded-full bg-fill px-3 py-1.5 text-small text-text-soft"
              >
                {event.time ? `${event.title} · ${event.time}` : event.title}
              </span>
            ))}
          </div>
        ) : null}
        {empty ? (
          <p className="py-1 text-ui text-text-faint">{messages.planEmptyDay}</p>
        ) : (
          <ul>
            {dayBlocks.map((block) => (
              <PlanRow
                key={block.id}
                block={block}
                lookup={lookup}
                past={past}
                canStart={canStart}
                starting={starting}
                records={choicesByBlock.get(block.id) ?? []}
                onOpen={onOpen}
                onOpenRecord={onOpenRecord}
                onStart={onStart}
              />
            ))}
          </ul>
        )}
        {unlinked.length > 0 ? (
          <div className="mt-5 border-t border-border pt-4">
            <Eyebrow as="div" className="mb-3">
              {messages.planAlsoStudied}
            </Eyebrow>
            <ul>
              {unlinked.map((record) => {
                const { info } = lookupSubject(lookup, record.nodeId ?? "");
                const path = formatPath(info.ancestors);
                const start = formatClock(new Date(record.startedAt), timeZone);
                const end = record.endedAt ? formatClock(new Date(record.endedAt), timeZone) : "";
                return (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={(event) => onOpenRecord(record.id, event.currentTarget)}
                      className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3.5 rounded-row px-2 py-2.5 text-left hover:bg-fill"
                    >
                      <Swatch color={info.color} />
                      <span className="block min-w-0 flex-1">
                        <span title={info.name} className="block truncate font-semibold">
                          {info.name}
                        </span>
                        {path ? (
                          <span
                            title={path}
                            className="block truncate text-caption text-text-faint"
                          >
                            {path}
                          </span>
                        ) : null}
                      </span>
                      <span className="num whitespace-nowrap text-right text-small text-text-soft">
                        {formatSeconds(record.activeSeconds)} · {start}–{end}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
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
