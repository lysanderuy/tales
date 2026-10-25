"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { useViewport } from "@/components/shared/picker";
import { PickerRowButton } from "@/components/shared/picker-row";
import { useDismiss } from "@/components/shared/use-dismiss";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatEventMeta } from "@/lib/events/dates";
import { messages } from "@/lib/messages";
import { PICKER_MAX_HEIGHT, PICKER_WIDTH, placeFloating } from "@/lib/picker/position";
import type { EventSummaryResponse } from "@/validators/event.validator";

const surfaceClass =
  "fixed z-[var(--z-float)] overflow-hidden rounded-[var(--radius-picker)] border border-border bg-surface";

type EventPickerProps = {
  anchor: HTMLElement | null;
  events: readonly EventSummaryResponse[];
  selectedId: string | null;
  today: string;
  onPick: (eventId: string | null) => void;
  onClose: () => void;
};

export function EventPicker({
  anchor,
  events,
  selectedId,
  today,
  onPick,
  onClose,
}: EventPickerProps) {
  const viewport = useViewport();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  const close = useDismiss(rootRef, anchorRef, true, onClose);

  const placement = useMemo(
    () =>
      anchor
        ? placeFloating(anchor.getBoundingClientRect(), PICKER_WIDTH, PICKER_MAX_HEIGHT, viewport)
        : null,
    [anchor, viewport],
  );

  useEffect(() => {
    if (!placement) return;
    const rows = rootRef.current?.querySelectorAll<HTMLElement>("[data-picker-row]");
    if (!rows) return;
    const checked = [...rows].find((row) => row.hasAttribute("aria-current"));
    (checked ?? rows[0])?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement !== null]);

  if (!placement) return null;

  const pick = (eventId: string | null) => {
    onPick(eventId);
    close();
  };

  const verticalStyle = { top: placement.top ?? undefined, bottom: placement.bottom ?? undefined };
  const upcoming = events.filter((event) => event.state !== "closed");
  const past = events.filter((event) => event.state === "closed");

  const section = (label: string, rows: readonly EventSummaryResponse[]) =>
    rows.length > 0 ? (
      <>
        {upcoming.length > 0 && past.length > 0 ? (
          <Eyebrow as="div" className="px-3 pb-1 pt-2.5">
            {label}
          </Eyebrow>
        ) : null}
        {rows.map((event) => (
          <PickerRowButton
            key={event.id}
            name={event.title}
            sub={null}
            right={formatEventMeta(event.date, event.time, today)}
            checked={event.id === selectedId}
            onClick={() => pick(event.id)}
          />
        ))}
      </>
    ) : null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const scope = target.closest<HTMLElement>("[data-picker-scope]");
    if (!scope) return;
    const items = [...scope.querySelectorAll<HTMLElement>("[data-picker-row]")];
    const next = items.indexOf(target) + (event.key === "ArrowDown" ? 1 : -1);
    event.preventDefault();
    items[Math.max(0, Math.min(next, items.length - 1))]?.focus();
  }

  return createPortal(
    <div ref={rootRef} onKeyDown={onKeyDown}>
      <div
        role="dialog"
        aria-label={messages.planEventPlaceholder}
        data-picker-scope=""
        className={surfaceClass}
        style={{ left: placement.left, width: PICKER_WIDTH, ...verticalStyle }}
      >
        <div
          className="overflow-auto px-1.5 py-1.5"
          style={{ maxHeight: `min(400px, ${viewport.height - 96}px)` }}
        >
          {selectedId !== null ? (
            <PickerRowButton
              name={messages.planNoEvent}
              checked={false}
              onClick={() => pick(null)}
            />
          ) : null}
          {section(messages.eventsUpcoming, upcoming)}
          {section(messages.eventsPast, past)}
        </div>
      </div>
    </div>,
    document.body,
  );
}
