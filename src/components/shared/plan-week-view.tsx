"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";

import { PlanCard, PlanEventCard, PlanGhostCard } from "@/components/shared/plan-card";
import {
  lookupSubject,
  recordChoicesByBlock,
  type OpenRecord,
  type PlanLookup,
} from "@/components/shared/plan-row";
import type { RecordChoice } from "@/components/shared/record-chooser";
import { PlanSummary } from "@/components/shared/plan-summary";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Swatch } from "@/components/ui/swatch";
import { useUpdateBlock } from "@/hooks/use-update-block";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { dayOfMonth, formatDayTitle, formatWeekdayShort } from "@/lib/plan/dates";
import { BAND_LABELS, bandOf, firstStartClock, groupIntoBands, type Band } from "@/lib/plan/bands";
import { formatClock, localDateKey } from "@/lib/time/zone";
import type { BlockResponse } from "@/validators/block.validator";
import type { EventSummaryResponse } from "@/validators/event.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

const HOLD_MS = 250;
const HOLD_TOLERANCE = 5;

type PlanWeekViewProps = {
  weekDays: readonly string[];
  today: string;
  weekBlocks: readonly BlockResponse[];
  events: readonly EventSummaryResponse[];
  records: readonly SessionResponse[];
  lookup: PlanLookup;
  timeZone: string;
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
  onOpenDay: (date: string) => void;
};

type ColumnItem =
  | { kind: "block"; block: BlockResponse }
  | { kind: "ghost"; record: SessionResponse }
  | { kind: "event"; event: EventSummaryResponse };

type ColumnProps = {
  date: string;
  today: string;
  blocks: readonly BlockResponse[];
  events: readonly EventSummaryResponse[];
  ghosts: readonly SessionResponse[];
  lookup: PlanLookup;
  timeZone: string;
  choicesByBlock: ReadonlyMap<string, RecordChoice[]>;
  sessionsByBlock: ReadonlyMap<string, SessionResponse[]>;
  currentBand: Band;
  onOpen: (block: BlockResponse, opener: HTMLElement) => void;
  onOpenRecord: OpenRecord;
  onOpenDay: (date: string) => void;
};

function PlanWeekColumn({
  date,
  today,
  blocks,
  events,
  ghosts,
  lookup,
  timeZone,
  choicesByBlock,
  sessionsByBlock,
  currentBand,
  onOpen,
  onOpenRecord,
  onOpenDay,
}: ColumnProps) {
  const drop = useDroppable({ id: date });
  const past = date <= today;
  const untimedEvents = events.filter((event) => event.time === null);
  const items: ColumnItem[] = [
    ...events
      .filter((event) => event.time !== null)
      .map((event): ColumnItem => ({ kind: "event", event })),
    ...blocks.map((block): ColumnItem => ({ kind: "block", block })),
    ...(past ? ghosts.map((record): ColumnItem => ({ kind: "ghost", record })) : []),
  ];
  const groups = groupIntoBands(
    items,
    (item) => {
      if (item.kind === "event") return item.event.time;
      return item.kind === "block"
        ? (item.block.timeOfDay ?? firstStartClock(sessionsByBlock.get(item.block.id), timeZone))
        : formatClock(new Date(item.record.startedAt), timeZone);
    },
    // Sorted by time of day first, then position; events lead and ghosts follow blocks on a tie.
    (item) => {
      if (item.kind === "event") return -1;
      return item.kind === "block" ? item.block.position : Number.MAX_SAFE_INTEGER;
    },
  );

  return (
    <div
      ref={(element) => drop.setNodeRef(element)}
      className={cn(
        "flex min-h-[340px] flex-col border-l border-border px-2.5 pb-3 transition-colors duration-[var(--dur-fast)] first:border-l-0 first:pl-0 last:pr-0",
        drop.isOver && "bg-fill",
      )}
    >
      <div className="mb-3 flex min-h-[54px] items-start justify-between">
        <button
          type="button"
          title={messages.planOpenDay}
          aria-label={`${messages.planOpenDay} ${formatDayTitle(date)}`}
          onClick={() => onOpenDay(date)}
          className="group flex flex-col items-start"
        >
          <Eyebrow>{formatWeekdayShort(date)}</Eyebrow>
          <span
            className={cn(
              "num -ml-2 rounded-full px-2 text-[24px] font-semibold leading-[1.3] tracking-[-0.02em] group-hover:bg-fill",
              date === today && "bg-primary-soft text-primary group-hover:bg-primary-soft",
            )}
          >
            {dayOfMonth(date)}
          </span>
        </button>
      </div>
      {untimedEvents.map((event) => (
        <PlanEventCard key={event.id} event={event} lookup={lookup} />
      ))}
      {groups.map((group) => (
        <div key={group.band}>
          <Eyebrow
            className={cn(
              "mb-2 block",
              date === today && group.band === currentBand && "text-primary",
            )}
          >
            {BAND_LABELS[group.band]}
          </Eyebrow>
          {group.items.map((item) => {
            if (item.kind === "event") {
              return <PlanEventCard key={item.event.id} event={item.event} lookup={lookup} />;
            }
            return item.kind === "block" ? (
              <PlanCard
                key={item.block.id}
                block={item.block}
                lookup={lookup}
                past={past}
                missed={date < today && item.block.progressSeconds === 0}
                timeZone={timeZone}
                records={choicesByBlock.get(item.block.id) ?? []}
                sessions={sessionsByBlock.get(item.block.id) ?? []}
                onOpen={onOpen}
                onOpenRecord={onOpenRecord}
              />
            ) : (
              <PlanGhostCard
                key={item.record.id}
                record={item.record}
                lookup={lookup}
                timeZone={timeZone}
                onOpenRecord={onOpenRecord}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function PlanWeekView({
  weekDays,
  today,
  weekBlocks,
  events,
  records,
  lookup,
  timeZone,
  onOpen,
  onOpenRecord,
  onOpenDay,
}: PlanWeekViewProps) {
  const update = useUpdateBlock();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: HOLD_MS, tolerance: HOLD_TOLERANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: HOLD_MS, tolerance: HOLD_TOLERANCE },
    }),
  );

  const recordsByDate = useMemo(() => {
    const byDate = new Map<string, SessionResponse[]>();
    for (const record of records) {
      const date = localDateKey(new Date(record.startedAt), timeZone);
      byDate.set(date, [...(byDate.get(date) ?? []), record]);
    }
    return byDate;
  }, [records, timeZone]);

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

  const pastRecords = useMemo(
    () =>
      weekDays
        .filter((date) => date <= today)
        .flatMap((date) => recordsByDate.get(date) ?? [])
        .map((record) => ({ nodeId: record.nodeId, seconds: record.activeSeconds })),
    [weekDays, today, recordsByDate],
  );
  const hasPast = weekDays.some((date) => date <= today);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    setActiveId(null);
    const target = event.over ? String(event.over.id) : null;
    const block = weekBlocks.find((candidate) => candidate.id === id);
    if (!block || !target || target === block.date) return;
    update.mutate({ id, date: target });
  }

  const activeBlock = activeId ? weekBlocks.find((block) => block.id === activeId) : undefined;
  const activeSubject = activeBlock ? lookupSubject(lookup, activeBlock.nodeId).info : null;

  return (
    <div className="grid grid-cols-12 items-start gap-4">
      <Card className="col-span-12">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="grid min-w-[1092px] grid-cols-[repeat(7,minmax(156px,1fr))]">
              {weekDays.map((date) => (
                <PlanWeekColumn
                  key={date}
                  date={date}
                  today={today}
                  blocks={weekBlocks.filter((block) => block.date === date)}
                  events={events.filter((event) => event.date === date)}
                  ghosts={(recordsByDate.get(date) ?? []).filter(
                    (record) => record.blockId === null,
                  )}
                  lookup={lookup}
                  timeZone={timeZone}
                  choicesByBlock={choicesByBlock}
                  sessionsByBlock={sessionsByBlock}
                  currentBand={currentBand}
                  onOpen={onOpen}
                  onOpenRecord={onOpenRecord}
                  onOpenDay={onOpenDay}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeSubject ? (
                <div className="flex items-center gap-2 rounded-row border border-border bg-surface px-3 py-1.5 text-ui font-semibold">
                  <Swatch color={activeSubject.color} />
                  <span className="truncate">{activeSubject.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </Card>
      <PlanSummary
        className="col-span-12"
        title={messages.planPlannedThisWeek}
        blocks={weekBlocks}
        studied={hasPast ? pastRecords : null}
        index={lookup.index}
        wide
      />
    </div>
  );
}
