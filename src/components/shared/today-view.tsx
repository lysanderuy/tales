"use client";

import { useMemo } from "react";

import { HeroCard } from "@/components/shared/hero-card";
import { PastSevenDaysCard } from "@/components/shared/past-seven-days-card";
import { RunningBar } from "@/components/shared/running-bar";
import { StartControl } from "@/components/shared/start-control";
import { TimeBySubjectCard } from "@/components/shared/time-by-subject-card";
import { TodaySkeleton } from "@/components/shared/today-skeleton";
import { TodaysStudyCard } from "@/components/shared/todays-study-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useActiveSession } from "@/hooks/use-session-clock";
import { useSubjects } from "@/hooks/use-subjects";
import { useToday } from "@/hooks/use-today";
import { messages } from "@/lib/messages";
import { formatDateEyebrow } from "@/lib/today/format";
import { decideHero } from "@/lib/today/hero";
import { buildSubjectIndex } from "@/lib/today/subject-index";

const wide = "col-span-12 min-[900px]:col-span-7";
const narrow = "col-span-12 min-[900px]:col-span-5";

export function TodayView() {
  const today = useToday();
  const subjects = useSubjects();

  const session = useActiveSession();

  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);

  if (today.isError && !today.data) {
    return (
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8">
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button variant="fill" onClick={() => void today.refetch()}>
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!today.data || subjects.isPending) return <TodaySkeleton />;

  const data = today.data;
  const hero = decideHero(data);

  const bySubject = (
    <TimeBySubjectCard
      totalSeconds={data.totalSeconds}
      bySubject={data.bySubject}
      index={index}
      className={narrow}
    />
  );
  const study = <TodaysStudyCard rows={data.rows} index={index} className={wide} />;

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8">
      <div className="mb-5 flex min-h-14 items-end justify-between gap-4">
        <div>
          <Eyebrow as="div" className="num">
            {formatDateEyebrow(data.todayDate)}
          </Eyebrow>
          <h1 className="text-h1 font-semibold tracking-[-0.02em]">{messages.todayTitle}</h1>
        </div>
        {session ? (
          <RunningBar
            session={session}
            subjectName={session.nodeId ? (index.get(session.nodeId)?.name ?? null) : null}
          />
        ) : (
          <StartControl />
        )}
      </div>
      <div className="grid grid-cols-12 gap-4">
        {hero.visible ? (
          <>
            <HeroCard hero={hero} className={wide} />
            {bySubject}
            {study}
            <PastSevenDaysCard
              todayDate={data.todayDate}
              days={data.past7Days}
              index={index}
              className={narrow}
            />
          </>
        ) : (
          <>
            {study}
            {bySubject}
            <PastSevenDaysCard
              todayDate={data.todayDate}
              days={data.past7Days}
              index={index}
              className="col-span-12"
            />
          </>
        )}
      </div>
    </main>
  );
}
