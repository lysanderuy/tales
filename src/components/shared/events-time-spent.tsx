"use client";

import { useState } from "react";

import { Total } from "@/components/shared/subjects-detail";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Swatch } from "@/components/ui/swatch";
import {
  formatSessionWhen,
  spansMultipleRoots,
  totalSessionSeconds,
  type EventSession,
} from "@/lib/events/log";
import { messages } from "@/lib/messages";
import { formatSeconds } from "@/lib/today/format";
import { resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";

const PREVIEW_COUNT = 5;

type EventsTimeSpentProps = {
  sessions: readonly EventSession[];
  index: SubjectIndex;
  timeZone: string;
};

export function EventsTimeSpent({ sessions, index, timeZone }: EventsTimeSpentProps) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? sessions : sessions.slice(0, PREVIEW_COUNT);
  const multi = spansMultipleRoots(sessions, index);

  return (
    <>
      <div className="mt-6">
        <Eyebrow as="div">{messages.subjectsAllTime}</Eyebrow>
        <Total seconds={totalSessionSeconds(sessions)} />
      </div>
      {sessions.length > 0 ? (
        <div className="mt-6">
          <Eyebrow as="div" className="mb-2">
            {messages.subjectsStudyLog}
          </Eyebrow>
          <ul>
            {shown.map((session) => {
              const info = resolveSubject(index, session.nodeId, messages.todayUnknownSubject);
              return (
                <li
                  key={session.id}
                  className="flex min-w-0 items-center gap-2.5 border-t border-border py-3 first:border-t-0 first:pt-1"
                >
                  {multi ? <Swatch color={info.color} /> : null}
                  <div className="min-w-0 flex-1">
                    <div title={info.name} className="truncate text-ui font-semibold">
                      {info.name}
                    </div>
                    <div className="num truncate text-caption text-text-faint">
                      {formatSessionWhen(session, timeZone)}
                    </div>
                  </div>
                  <div className="num whitespace-nowrap text-right text-small text-text-soft">
                    {formatSeconds(session.seconds)}
                  </div>
                </li>
              );
            })}
          </ul>
          {!showAll && sessions.length > PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-2 w-full border-t border-border pt-3 text-left text-small text-text-faint hover:text-text-soft"
            >
              {`${messages.subjectsShowAll} ${sessions.length}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
