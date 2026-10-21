"use client";

import { CountdownOptions } from "@/components/shared/countdown-options";
import { CheckIcon, MethodIcon, NoteIcon, PlusIcon } from "@/components/shared/icons";
import { ToolMenu } from "@/components/shared/tool-menu";
import { IconButton } from "@/components/ui/icon-button";
import { useExtendSession } from "@/hooks/use-extend-session";
import { useUpdateSession } from "@/hooks/use-update-session";
import { messages } from "@/lib/messages";
import type { ClockDisplay } from "@/lib/timer/clock";
import type { SessionResponse } from "@/validators/study-session.validator";

type MethodTag = NonNullable<SessionResponse["methodTag"]>;

export const METHODS: readonly { tag: MethodTag; label: string }[] = [
  { tag: "lecture_notes", label: messages.methodLectureNotes },
  { tag: "personal_notes", label: messages.methodPersonalNotes },
  { tag: "flashcards", label: messages.methodFlashcards },
  { tag: "questions", label: messages.methodQuestions },
];

type FocusToolsProps = {
  session: SessionResponse;
  display: ClockDisplay;
  hasNote: boolean;
  noteOpen: boolean;
  onToggleNote: () => void;
};

export function FocusTools({ session, display, hasNote, noteOpen, onToggleNote }: FocusToolsProps) {
  const update = useUpdateSession();
  const extend = useExtendSession();

  return (
    <div className="mt-8 flex justify-center gap-3.5">
      <ToolMenu
        label={messages.focusMethod}
        variant={session.methodTag ? "tint" : "fill"}
        icon={<MethodIcon />}
      >
        {(close) =>
          METHODS.map(({ tag, label }) => (
            <button
              key={tag}
              type="button"
              disabled={update.isPending}
              onClick={() => {
                close();
                update.mutate({
                  id: session.id,
                  methodTag: session.methodTag === tag ? null : tag,
                });
              }}
              className="flex w-full items-center justify-between rounded-row p-2.5 text-left text-ui hover:bg-fill"
            >
              {label}
              {session.methodTag === tag ? <CheckIcon /> : null}
            </button>
          ))
        }
      </ToolMenu>
      <IconButton
        label={messages.focusNote}
        variant={hasNote ? "tint" : "fill"}
        aria-expanded={noteOpen}
        onClick={onToggleNote}
      >
        <NoteIcon />
      </IconButton>
      {session.plannedMinutes !== null ? (
        <ToolMenu
          label={messages.focusAddTime}
          variant={display.over ? "warm" : "fill"}
          icon={<PlusIcon />}
        >
          {(close) => (
            <CountdownOptions
              disabled={extend.isPending}
              onSelect={(minutes) => {
                close();
                extend.mutate({ id: session.id, minutes });
              }}
            />
          )}
        </ToolMenu>
      ) : null}
    </div>
  );
}
