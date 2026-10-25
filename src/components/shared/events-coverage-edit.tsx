"use client";

import { useCallback, useEffect, useState } from "react";

import { EventsMenu } from "@/components/shared/events-menu";
import { CloseIcon, PlusIcon } from "@/components/shared/icons";
import { Picker } from "@/components/shared/picker";
import { IconButton } from "@/components/ui/icon-button";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { removeCover, replaceCover, setMark, type CoverageDraft } from "@/lib/events/coverage";
import { markLabel } from "@/lib/events/marks";
import { messages } from "@/lib/messages";
import { formatPath, resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";

type EventsCoverageEditProps = {
  draft: CoverageDraft;
  markable: boolean;
  index: SubjectIndex;
  onChange: (next: CoverageDraft) => void;
  onOverlayChange: (open: boolean) => void;
};

type OpenPicker = { row: number; anchor: HTMLElement };

export function EventsCoverageEdit({
  draft,
  markable,
  index,
  onChange,
  onOverlayChange,
}: EventsCoverageEditProps) {
  const [picker, setPicker] = useState<OpenPicker | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closePicker = useCallback(() => setPicker(null), []);
  const last = draft.covers[draft.covers.length - 1];

  useEffect(() => {
    onOverlayChange(picker !== null || menuOpen);
  }, [picker, menuOpen, onOverlayChange]);

  function openPicker(row: number, anchor: HTMLElement) {
    setPicker((current) => (current?.row === row ? null : { row, anchor }));
  }

  return (
    <div>
      {draft.covers.map((id, row) => {
        const info = id ? resolveSubject(index, id, messages.todayUnknownSubject) : null;
        const path = info ? formatPath(info.ancestors) : "";
        const mark = id ? draft.marks[id] : undefined;
        return (
          <div key={row} className="flex min-h-11 items-center gap-2.5 py-[7px]">
            {info ? <Swatch color={info.color} /> : null}
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={picker?.row === row}
              onClick={(event) => openPicker(row, event.currentTarget)}
              className={cn(
                "min-w-0 flex-1 rounded-row py-0.5 text-left",
                info
                  ? "hover:underline hover:decoration-border hover:underline-offset-4"
                  : "text-body text-text-faint underline decoration-border underline-offset-4",
              )}
            >
              {info ? (
                <>
                  <span title={info.name} className="block truncate text-ui font-semibold">
                    {info.name}
                  </span>
                  {path ? (
                    <span title={path} className="block truncate text-caption text-text-faint">
                      {path}
                    </span>
                  ) : null}
                </>
              ) : (
                messages.eventsPickCoverage
              )}
            </button>
            {markable && id ? (
              <EventsMenu
                onOpenChange={setMenuOpen}
                items={[
                  {
                    label: markLabel("confident"),
                    run: () => onChange(setMark(draft, id, "confident")),
                  },
                  {
                    label: markLabel("review_again"),
                    run: () => onChange(setMark(draft, id, "review_again")),
                  },
                  ...(mark
                    ? [
                        {
                          label: messages.eventsClearMark,
                          run: () => onChange(setMark(draft, id, null)),
                        },
                      ]
                    : []),
                ]}
                trigger={({ triggerRef, open, toggle }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={open}
                    aria-label={messages.eventsMarkLabel}
                    onClick={toggle}
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-1.5 text-small hover:bg-fill",
                      mark ? "text-text-soft" : "text-text-faint",
                    )}
                  >
                    {mark ? markLabel(mark) : messages.eventsMark}
                  </button>
                )}
              />
            ) : null}
            <IconButton
              size="xs"
              label={messages.eventsRemoveCoverage}
              onClick={() => {
                setPicker(null);
                onChange(removeCover(draft, row));
              }}
            >
              <CloseIcon size={14} />
            </IconButton>
          </div>
        );
      })}
      {draft.covers.length === 0 || last ? (
        <div className="mt-1.5">
          <IconButton
            size="xs"
            variant="tint"
            label={messages.eventsAddCoverage}
            onClick={(event) => {
              onChange({ ...draft, covers: [...draft.covers, null] });
              openPicker(draft.covers.length, event.currentTarget);
            }}
          >
            <PlusIcon size={16} />
          </IconButton>
        </div>
      ) : null}
      {picker ? (
        <Picker
          anchor={picker.anchor}
          selected={{ nodeId: draft.covers[picker.row] ?? null, blockId: null }}
          onPick={(nodeId) => onChange(replaceCover(draft, picker.row, nodeId))}
          onClose={closePicker}
          hidePlanned
        />
      ) : null}
    </div>
  );
}
