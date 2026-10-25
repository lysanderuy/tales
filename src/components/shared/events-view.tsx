"use client";

import { useMemo, useState } from "react";

import { EventsAddDialog } from "@/components/shared/events-add-dialog";
import { EventsDetail } from "@/components/shared/events-detail";
import { EventsEmpty } from "@/components/shared/events-empty";
import { EventsList } from "@/components/shared/events-list";
import { EventsSkeleton } from "@/components/shared/events-skeleton";
import { PlusIcon } from "@/components/shared/icons";
import { RunningBar } from "@/components/shared/running-bar";
import { StartControl } from "@/components/shared/start-control";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { useEvents } from "@/hooks/use-events";
import { useProfile } from "@/hooks/use-profile";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useSubjectsWithTotals } from "@/hooks/use-subjects-with-totals";
import { useToday } from "@/hooks/use-today";
import { cn } from "@/lib/cn";
import { groupEvents } from "@/lib/events/group";
import { messages } from "@/lib/messages";
import { DEFAULT_TIME_ZONE, localDateKey } from "@/lib/time/zone";
import { buildSubjectIndex } from "@/lib/today/subject-index";

const wide = "col-span-24 min-[900px]:col-span-13";
const narrow = "col-span-24 min-[900px]:sticky min-[900px]:top-[88px] min-[900px]:col-span-11";
const mainClass = "mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8";

export function EventsView() {
  const events = useEvents();
  const subjects = useSubjectsWithTotals();
  const profile = useProfile();
  const todayQuery = useToday();
  const { session, display } = useSessionClock();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ opener: HTMLElement | null } | null>(null);

  const list = events.data?.events;
  const nodes = subjects.data;
  const index = useMemo(() => buildSubjectIndex(nodes ?? []), [nodes]);
  const groups = useMemo(() => groupEvents(list ?? []), [list]);

  if ((events.isError && !list) || (subjects.isError && !nodes)) {
    return (
      <main className={mainClass}>
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button
            variant="fill"
            onClick={() => {
              void events.refetch();
              void subjects.refetch();
            }}
          >
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!list || !nodes) return <EventsSkeleton />;

  const timeZone = profile.data?.timeZone ?? DEFAULT_TIME_ZONE;
  const today = todayQuery.data?.todayDate ?? localDateKey(new Date(), timeZone);
  const selected = list.find((event) => event.id === selectedId) ?? null;
  const empty = list.length === 0;

  return (
    <main className={mainClass}>
      <div className="mb-5 flex min-h-14 items-end justify-between gap-4">
        <div>
          {empty ? null : (
            <Eyebrow as="div" className="num">
              {`${list.length} ${list.length === 1 ? messages.eventsCountOne : messages.eventsCountMany}`}
            </Eyebrow>
          )}
          <h1 className="text-h1 font-semibold tracking-[-0.02em]">{messages.eventsTitle}</h1>
        </div>
        {session && display ? (
          <RunningBar
            session={session}
            display={display}
            subjectName={session.nodeId ? (index.get(session.nodeId)?.name ?? null) : null}
          />
        ) : (
          <StartControl />
        )}
      </div>
      <div className="grid grid-cols-24 items-start gap-4">
        <Card className={cn(selected ? wide : "col-span-24")}>
          {empty ? (
            <EventsEmpty onAdd={() => setAdding({ opener: null })} />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-h2 font-semibold tracking-[-0.01em]">{messages.eventsAll}</h2>
                <IconButton
                  size="xs"
                  variant="tint"
                  label={messages.eventsAddEvent}
                  onClick={(event) => setAdding({ opener: event.currentTarget })}
                >
                  <PlusIcon size={18} />
                </IconButton>
              </div>
              <EventsList
                upcoming={groups.upcoming}
                past={groups.past}
                today={today}
                selectedId={selected?.id ?? null}
                onSelect={setSelectedId}
              />
            </>
          )}
        </Card>
        {selected ? (
          <EventsDetail
            key={selected.id}
            event={selected}
            index={index}
            today={today}
            timeZone={timeZone}
            className={narrow}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : null}
      </div>
      {adding ? (
        <EventsAddDialog
          today={today}
          index={index}
          opener={adding.opener}
          onClose={() => setAdding(null)}
          onCreated={setSelectedId}
        />
      ) : null}
    </main>
  );
}
