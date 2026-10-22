"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { PickerRowButton } from "@/components/shared/picker-row";
import { useDismiss } from "@/components/shared/use-dismiss";
import { messages } from "@/lib/messages";
import { PICKER_MAX_HEIGHT, PICKER_WIDTH, placeFloating } from "@/lib/picker/position";
import { moveTargets, type ChildrenMap, type SubjectNode } from "@/lib/subjects/tree";
import { formatPath, type SubjectIndex } from "@/lib/today/subject-index";

const INDENT_PER_LEVEL = 16;

type SubjectsMoveMenuProps = {
  node: SubjectNode;
  childMap: ChildrenMap;
  index: SubjectIndex;
  anchor: HTMLElement;
  onPick: (parentId: string | null) => void;
  onClose: () => void;
};

export function SubjectsMoveMenu({
  node,
  childMap,
  index,
  anchor,
  onPick,
  onClose,
}: SubjectsMoveMenuProps) {
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLElement | null>(anchor);
  const close = useDismiss(rootRef, anchorRef, true, onClose);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const [placement] = useState(() =>
    placeFloating(anchor.getBoundingClientRect(), PICKER_WIDTH, PICKER_MAX_HEIGHT, {
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  );

  const targets = useMemo(() => moveTargets(childMap, node.id), [childMap, node.id]);
  const needle = query.trim().toLowerCase();
  const searching = needle !== "";
  const matches = searching
    ? targets.filter((target) => {
        const path = formatPath(index.get(target.node.id)?.ancestors ?? []);
        return `${target.node.name} ${path}`.toLowerCase().includes(needle);
      })
    : targets;
  const showTop = !searching && node.parentId !== null;

  const pick = (parentId: string | null) => {
    onPick(parentId);
    close();
  };

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-label={messages.subjectsMoveLabel}
      data-subjects-layer=""
      className="fixed z-[var(--z-float)] overflow-hidden rounded-[var(--radius-picker)] border border-border bg-surface"
      style={{
        left: placement.left,
        width: PICKER_WIDTH,
        top: placement.top ?? undefined,
        bottom: placement.bottom ?? undefined,
      }}
    >
      <div className="px-2 pb-1 pt-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={messages.subjectsSearchPlaceholder}
          aria-label={messages.subjectsSearchPlaceholder}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          className="w-full min-w-0 rounded-full bg-fill px-3.5 py-2.5 text-ui text-text placeholder:text-text-faint focus-visible:outline-offset-[-2px]"
        />
      </div>
      <div className="max-h-[400px] overflow-auto px-1.5 pb-2 pt-1">
        {showTop ? (
          <PickerRowButton
            name={messages.subjectsTopLevel}
            checked={false}
            strong
            onClick={() => pick(null)}
          />
        ) : null}
        {matches.map((target) => (
          <PickerRowButton
            key={target.node.id}
            name={target.node.name}
            sub={searching ? formatPath(index.get(target.node.id)?.ancestors ?? []) : null}
            color={target.depth === 0 ? index.get(target.node.id)?.color : undefined}
            strong={target.hasChildren}
            indent={searching ? 0 : target.depth * INDENT_PER_LEVEL}
            checked={false}
            onClick={() => pick(target.node.id)}
          />
        ))}
        {matches.length === 0 && !showTop ? (
          <p className="px-3 py-3 text-ui text-text-faint">{messages.pickerNoMatch}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
