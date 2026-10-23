"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { EditRecordDialog } from "@/components/shared/edit-record-dialog";

import { Eyebrow } from "@/components/ui/eyebrow";
import { invalidateSubjectData } from "@/hooks/use-subjects";
import { formatLogWhen } from "@/lib/subjects/log";
import { messages } from "@/lib/messages";
import { formatSeconds } from "@/lib/today/format";
import type { SubjectIndex } from "@/lib/today/subject-index";
import type { SessionResponse } from "@/validators/study-session.validator";

const PREVIEW_COUNT = 5;

type SubjectsStudyLogProps = {
  records: readonly SessionResponse[];
  index: SubjectIndex;
  timeZone: string | null;
};

export function SubjectsStudyLog({ records, index, timeZone }: SubjectsStudyLogProps) {
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<{ id: string; opener: HTMLElement | null } | null>(null);
  const queryClient = useQueryClient();
  if (records.length === 0) return null;

  const shown = showAll ? records : records.slice(0, PREVIEW_COUNT);
  const now = new Date();
  const labels = { today: messages.subjectsToday, yesterday: messages.subjectsYesterday };

  return (
    <div className="mt-6">
      {editing ? (
        <EditRecordDialog
          recordId={editing.id}
          opener={editing.opener}
          onClose={() => {
            setEditing(null);
            invalidateSubjectData(queryClient);
          }}
        />
      ) : null}
      <Eyebrow as="div" className="mb-2">
        {messages.subjectsStudyLog}
      </Eyebrow>
      <ul>
        {shown.map((record) => {
          const name = record.nodeId ? (index.get(record.nodeId)?.name ?? "") : "";
          return (
            <li
              key={record.id}
              className="flex min-w-0 items-center gap-3.5 border-t border-border py-3 first:border-t-0 first:pt-0"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={(event) => setEditing({ id: record.id, opener: event.currentTarget })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setEditing({ id: record.id, opener: event.currentTarget });
                  }
                }}
                className="-mx-2.5 flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 rounded-row px-2.5 py-1 hover:bg-fill"
              >
                <div className="min-w-0 flex-1">
                  <div title={name} className="truncate text-ui font-semibold">
                    {name}
                  </div>
                  <div className="num truncate text-caption text-text-faint">
                    {timeZone
                      ? formatLogWhen(record.startedAt, record.endedAt, timeZone, now, labels)
                      : ""}
                  </div>
                </div>
                <div className="num whitespace-nowrap text-right text-small text-text-soft">
                  {formatSeconds(record.activeSeconds)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!showAll && records.length > PREVIEW_COUNT ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="-ml-3 mt-2 rounded-full px-3 py-1.5 text-small text-text-faint hover:bg-fill hover:text-text-soft"
        >
          {`${messages.subjectsShowAll} ${records.length}`}
        </button>
      ) : null}
    </div>
  );
}
