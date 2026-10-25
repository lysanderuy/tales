"use client";

import { useEffect, useMemo, useState } from "react";

import { PlanControls, type PlanViewMode } from "@/components/shared/plan-controls";
import { PlanDayView } from "@/components/shared/plan-day-view";
import { LogStudyDialog } from "@/components/shared/log-study-dialog";
import { PlanEditDialog } from "@/components/shared/plan-edit-dialog";
import type { PlanLookup } from "@/components/shared/plan-row";
import { PlanSkeleton } from "@/components/shared/plan-skeleton";
import { PlanWeekView } from "@/components/shared/plan-week-view";
import { EditRecordDialog } from "@/components/shared/edit-record-dialog";
import { RunningBar } from "@/components/shared/running-bar";
import { StartControl } from "@/components/shared/start-control";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { sortPlanBlocks, usePlanBlocks } from "@/hooks/use-plan-blocks";
import { usePlanEvents } from "@/hooks/use-plan-events";
import { usePlanRecords } from "@/hooks/use-plan-records";
import { useOpenFocus } from "@/hooks/use-open-focus";
import { useProfile } from "@/hooks/use-profile";
import { useActiveSession } from "@/hooks/use-session-clock";
import { useStartBlock } from "@/hooks/use-start-block";
import { useSubjects } from "@/hooks/use-subjects";
import { messages } from "@/lib/messages";
import { dayDiff, formatDayTitle, formatWeekRange, shiftDate, weekDates } from "@/lib/plan/dates";
import { unlockAudio } from "@/lib/sound/chime";
import { localDateKey } from "@/lib/time/zone";
import { buildSubjectIndex } from "@/lib/today/subject-index";
import type { BlockResponse } from "@/validators/block.validator";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

const mainClass = "mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8";

function eyebrowFor(mode: PlanViewMode, date: string, today: string): string {
  if (mode === "week") return messages.planWeek;
  const diff = dayDiff(today, date);
  if (diff === 0) return messages.planToday;
  if (diff === 1) return messages.planTomorrow;
  if (diff === -1) return messages.planYesterday;
  return diff > 0 ? messages.planInDays(String(diff)) : messages.planDaysAgo(String(-diff));
}

type PlanContentProps = {
  timeZone: string;
  subjects: readonly OutlineNodeResponse[];
};

function PlanContent({ timeZone, subjects }: PlanContentProps) {
  const [now, setNow] = useState(() => new Date());
  const today = localDateKey(now, timeZone);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<PlanViewMode>("day");
  const [editing, setEditing] = useState<{
    block: BlockResponse | null;
    opener: HTMLElement;
  } | null>(null);
  const [logging, setLogging] = useState<{ opener: HTMLElement } | null>(null);
  const [viewing, setViewing] = useState<{ recordId: string; opener: HTMLElement } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const next = new Date();
      setNow((prev) =>
        localDateKey(prev, timeZone) === localDateKey(next, timeZone) ? prev : next,
      );
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  const date = selected ?? today;
  const weekDays = useMemo(() => weekDates(date), [date]);
  const from = weekDays[0];
  const to = weekDays[weekDays.length - 1];

  const blocks = usePlanBlocks(from, to);
  const events = usePlanEvents(from, to);
  const records = usePlanRecords(from, to, timeZone);

  const session = useActiveSession();
  const startBlock = useStartBlock();
  const openFocus = useOpenFocus();

  const lookup = useMemo<PlanLookup>(
    () => ({
      index: buildSubjectIndex(subjects),
      archived: new Set(subjects.filter((node) => node.effectivelyArchived).map((node) => node.id)),
    }),
    [subjects],
  );

  const weekBlocks = useMemo(() => sortPlanBlocks(blocks.data ?? []), [blocks.data]);

  if (blocks.isError && !blocks.data) {
    return (
      <main className={mainClass}>
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button variant="fill" onClick={() => void blocks.refetch()}>
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!blocks.data) return <PlanSkeleton />;

  const play = (blockId: string) => {
    unlockAudio();
    startBlock.mutate({ blockId }, { onSuccess: openFocus });
  };

  const open = (block: BlockResponse, opener: HTMLElement) => setEditing({ block, opener });
  const openRecord = (recordId: string, opener: HTMLElement) => setViewing({ recordId, opener });
  const openDay = (day: string) => {
    setSelected(day);
    setMode("day");
  };

  const eventList = events.data?.events ?? [];
  const recordList = records.data ?? [];

  return (
    <main className={mainClass}>
      <div className="mb-5 flex min-h-14 items-end justify-between gap-4">
        <div>
          <Eyebrow as="div" className="num">
            {eyebrowFor(mode, date, today)}
          </Eyebrow>
          <h1 className="text-h1 font-semibold tracking-[-0.02em]">{messages.planTitle}</h1>
        </div>
        {session ? (
          <RunningBar
            session={session}
            subjectName={session.nodeId ? (lookup.index.get(session.nodeId)?.name ?? null) : null}
          />
        ) : (
          <StartControl />
        )}
      </div>
      <PlanControls
        title={mode === "day" ? formatDayTitle(date) : formatWeekRange(date)}
        mode={mode}
        onStep={(step) => setSelected(shiftDate(date, step, mode === "day" ? "day" : "week"))}
        onToday={() => setSelected(null)}
        onMode={setMode}
        pastDay={date < today}
        onPlan={(opener) => setEditing({ block: null, opener })}
        onLog={(opener) => setLogging({ opener })}
      />
      {events.isError || records.isError ? (
        <div role="alert" className="mb-4 flex items-center gap-3 text-small text-danger">
          <span>{messages.planLoadPartial}</span>
          <Button
            variant="fill"
            className="px-4 py-1.5 text-small"
            onClick={() => {
              if (events.isError) void events.refetch();
              if (records.isError) void records.refetch();
            }}
          >
            {messages.tryAgain}
          </Button>
        </div>
      ) : null}
      {mode === "day" ? (
        <PlanDayView
          date={date}
          today={today}
          weekDays={weekDays}
          weekBlocks={weekBlocks}
          events={eventList}
          records={recordList}
          lookup={lookup}
          timeZone={timeZone}
          canStart={!session && date === today}
          starting={startBlock.isPending}
          onOpen={open}
          onOpenRecord={openRecord}
          onStart={play}
          onPickDay={setSelected}
        />
      ) : (
        <PlanWeekView
          weekDays={weekDays}
          today={today}
          weekBlocks={weekBlocks}
          events={eventList}
          records={recordList}
          lookup={lookup}
          timeZone={timeZone}
          onOpen={open}
          onOpenRecord={openRecord}
          onOpenDay={openDay}
        />
      )}
      {editing ? (
        <PlanEditDialog
          key={editing.block?.id ?? "new"}
          block={editing.block}
          defaultDate={date}
          today={today}
          lookup={lookup}
          opener={editing.opener}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {logging ? (
        <LogStudyDialog
          defaultDate={date}
          today={today}
          timeZone={timeZone}
          lookup={lookup}
          opener={logging.opener}
          onClose={() => setLogging(null)}
        />
      ) : null}
      {viewing ? (
        <EditRecordDialog
          key={viewing.recordId}
          recordId={viewing.recordId}
          opener={viewing.opener}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </main>
  );
}

export function PlanView() {
  const profile = useProfile();
  const subjects = useSubjects();

  if ((profile.isError && !profile.data) || (subjects.isError && !subjects.data)) {
    return (
      <main className={mainClass}>
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button
            variant="fill"
            onClick={() => {
              void profile.refetch();
              void subjects.refetch();
            }}
          >
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!profile.data || !subjects.data) return <PlanSkeleton />;

  return <PlanContent timeZone={profile.data.timeZone} subjects={subjects.data} />;
}
