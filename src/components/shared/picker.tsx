"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { PickerRowButton } from "@/components/shared/picker-row";
import { PickerTopics } from "@/components/shared/picker-topics";
import { useDismiss } from "@/components/shared/use-dismiss";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useDebounce } from "@/hooks/use-debounce";
import { usePicker } from "@/hooks/use-picker";
import { useSubjects } from "@/hooks/use-subjects";
import { useToday } from "@/hooks/use-today";
import { messages } from "@/lib/messages";
import {
  buildHomeGroups,
  buildSearchGroups,
  isPicked,
  topicRows,
  type PickerRow,
  type PickerSelection,
} from "@/lib/picker/picker";
import {
  PANEL_WIDTH,
  PICKER_MAX_HEIGHT,
  PICKER_WIDTH,
  placeFloating,
  placeSide,
  type Viewport,
} from "@/lib/picker/position";

const SEARCH_DEBOUNCE_MS = 200;

const surfaceClass =
  "fixed z-[var(--z-float)] overflow-hidden rounded-[var(--radius-picker)] border border-border bg-surface";

type PickerProps = {
  id?: string;
  anchor: HTMLElement | null;
  selected: PickerSelection;
  onPick: (nodeId: string, blockId: string | null) => void;
  onClose: () => void;
  hidePlanned?: boolean;
};

function readViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function useViewport(): Viewport {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return viewport;
}

export function Picker({ id, anchor, selected, onPick, onClose, hidePlanned }: PickerProps) {
  const [query, setQuery] = useState("");
  const [sideId, setSideId] = useState<string | null>(null);
  const viewport = useViewport();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const focusPanelRef = useRef(false);

  const trimmed = query.trim();
  const picker = usePicker(useDebounce(trimmed, SEARCH_DEBOUNCE_MS));
  const subjects = useSubjects();
  const todayDate = useToday().data?.todayDate;

  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const close = useDismiss(rootRef, anchorRef, true, onClose);

  const data = useMemo(
    () => (hidePlanned && picker.data ? { ...picker.data, planned: [] } : picker.data),
    [hidePlanned, picker.data],
  );
  const nodes = subjects.data;
  const searchView = data?.nodes !== undefined;

  const home = useMemo(
    () => (data && nodes && !searchView ? buildHomeGroups(data, nodes, todayDate) : null),
    [data, nodes, searchView, todayDate],
  );
  const search = useMemo(
    () => (data && nodes && searchView ? buildSearchGroups(data, nodes, todayDate) : null),
    [data, nodes, searchView, todayDate],
  );

  const placement = useMemo(
    () =>
      anchor
        ? placeFloating(anchor.getBoundingClientRect(), PICKER_WIDTH, PICKER_MAX_HEIGHT, viewport)
        : null,
    [anchor, viewport],
  );

  const sideOpen = sideId !== null && home !== null && trimmed === "";
  const side = placement ? placeSide(placement.left, PICKER_WIDTH, PANEL_WIDTH, viewport) : null;
  const narrow = side ? !side.fits : false;
  const topics = useMemo(
    () => (sideOpen && sideId !== null && nodes ? topicRows(nodes, sideId) : []),
    [sideOpen, nodes, sideId],
  );

  useEffect(() => {
    if (!sideOpen || !focusPanelRef.current) return;
    focusPanelRef.current = false;
    rootRef.current?.querySelector<HTMLElement>("[data-picker-panel] [data-picker-row]")?.focus();
  }, [sideOpen, sideId]);

  if (!placement || !side) return null;

  const pick = (nodeId: string, blockId: string | null) => {
    onPick(nodeId, blockId);
    close();
  };

  const verticalStyle = { top: placement.top ?? undefined, bottom: placement.bottom ?? undefined };

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const scope = target.closest<HTMLElement>("[data-picker-scope]");
    if (!scope) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const items = [...scope.querySelectorAll<HTMLElement>("input, [data-picker-row]")];
      const next = items.indexOf(target) + (event.key === "ArrowDown" ? 1 : -1);
      event.preventDefault();
      items[Math.max(0, Math.min(next, items.length - 1))]?.focus();
    } else if (event.key === "Enter" && target === inputRef.current && trimmed !== "") {
      event.preventDefault();
      scope.querySelector<HTMLElement>("[data-picker-row]")?.click();
    } else if (event.key === "ArrowRight" && target.dataset.expandable !== undefined) {
      event.preventDefault();
      focusPanelRef.current = true;
      setSideId(target.dataset.nodeId ?? null);
    } else if (
      event.key === "ArrowLeft" &&
      sideId &&
      !narrow &&
      scope.dataset.pickerPanel !== undefined
    ) {
      event.preventDefault();
      rootRef.current
        ?.querySelector<HTMLElement>(`[data-picker-scope] [data-node-id="${CSS.escape(sideId)}"]`)
        ?.focus();
    }
  }

  const renderRows = (rows: readonly PickerRow[]) =>
    rows.map((row) => (
      <PickerRowButton
        key={row.key}
        nodeId={row.nodeId}
        name={row.name}
        sub={row.sub}
        color={row.color}
        right={row.right}
        chevron={row.expandable}
        active={sideOpen && row.expandable && row.nodeId === sideId}
        checked={isPicked(row, selected)}
        onMouseEnter={narrow ? undefined : () => setSideId(row.expandable ? row.nodeId : null)}
        onClick={() => {
          if (row.expandable && narrow) setSideId(row.nodeId);
          else pick(row.nodeId, row.blockId);
        }}
      />
    ));

  const section = (label: string, rows: readonly PickerRow[]) =>
    rows.length > 0 ? (
      <>
        <Eyebrow as="div" className="px-3 pb-1 pt-2.5">
          {label}
        </Eyebrow>
        {renderRows(rows)}
      </>
    ) : null;

  const searchEmpty = search !== null && search.planned.length + search.results.length === 0;

  let body;
  if (sideOpen && narrow) {
    body = (
      <PickerTopics
        topics={topics}
        selected={selected}
        onBack={() => setSideId(null)}
        onPick={(nodeId) => pick(nodeId, null)}
      />
    );
  } else if (home) {
    body = (
      <>
        {section(messages.pickerPlanned, home.planned)}
        {section(messages.pickerRecent, home.recent)}
        {section(messages.pickerSubjects, home.subjects)}
      </>
    );
  } else if (search) {
    body = searchEmpty ? (
      <p className="px-3 py-3 text-ui text-text-faint">{messages.pickerNoMatch}</p>
    ) : (
      <>
        {section(messages.pickerPlanned, search.planned)}
        {section(messages.pickerSubjectsAndTopics, search.results)}
      </>
    );
  } else if (picker.isError || subjects.isError) {
    body = <p className="px-3 py-3 text-ui text-text-faint">{messages.pickerLoadFailed}</p>;
  }

  return createPortal(
    <div ref={rootRef} onKeyDown={onKeyDown}>
      <div
        id={id}
        role="dialog"
        aria-label={messages.todayWhatStudying}
        data-picker-scope=""
        className={surfaceClass}
        style={{ left: placement.left, width: PICKER_WIDTH, ...verticalStyle }}
      >
        <div className="px-2 pb-1 pt-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder={messages.pickerSearchPlaceholder}
            aria-label={messages.pickerSearchLabel}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setSideId(null);
            }}
            className="w-full min-w-0 rounded-full bg-fill px-3.5 py-2.5 text-ui text-text placeholder:text-text-faint focus-visible:outline-offset-[-2px]"
          />
        </div>
        <div
          className="overflow-auto px-1.5 pb-2 pt-1"
          style={{ maxHeight: `min(400px, ${viewport.height - 96}px)` }}
        >
          {body}
        </div>
      </div>
      {sideOpen && !narrow ? (
        <div
          data-picker-scope=""
          data-picker-panel=""
          className={surfaceClass}
          style={{ left: side.left, width: PANEL_WIDTH, ...verticalStyle }}
        >
          <div className="max-h-[400px] overflow-auto px-1.5 pb-2 pt-1.5">
            <PickerTopics
              topics={topics}
              selected={selected}
              onPick={(nodeId) => pick(nodeId, null)}
            />
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
