"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { SubjectsAddRow } from "@/components/shared/subjects-add-row";
import { SubjectsTreeRow } from "@/components/shared/subjects-tree-row";
import { Swatch } from "@/components/ui/swatch";
import { messages } from "@/lib/messages";
import {
  dropIntent,
  moveArgsFor,
  type DropContext,
  type DropIntent,
  type MoveArgs,
} from "@/lib/subjects/drop";
import {
  treeKeyAction,
  type ChildrenMap,
  type NodeMap,
  type SubjectRow,
} from "@/lib/subjects/tree";

const HOLD_MS = 250;
const HOLD_TOLERANCE = 5;
const HOVER_EXPAND_MS = 600;

export type AddConfig = {
  parentId: string | null;
  names: readonly string[];
  pending: boolean;
  onSubmit: (name: string, onDone: () => void) => void;
  onCancel: () => void;
};

export type RenameState = {
  id: string;
  names: readonly string[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

type SubjectsTreeProps = {
  rows: readonly SubjectRow[];
  byId: NodeMap;
  childMap: ChildrenMap;
  colorOf: (id: string) => string;
  query: string;
  selectedId: string | null;
  add: AddConfig | null;
  rename: RenameState | null;
  onSelect: (id: string | null) => void;
  onSetOpen: (id: string, open: boolean) => void;
  onRenameRequest: (id: string) => void;
  onMove: (id: string, args: MoveArgs) => void;
};

function pointerY(event: Event): number {
  if ("touches" in event) {
    const touch = (event as TouchEvent).touches[0];
    return touch ? touch.clientY : 0;
  }
  return (event as PointerEvent).clientY;
}

export function SubjectsTree({
  rows,
  byId,
  childMap,
  colorOf,
  query,
  selectedId,
  add,
  rename,
  onSelect,
  onSetOpen,
  onRenameRequest,
  onMove,
}: SubjectsTreeProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const focusId = useRef<string | null>(null);
  const startY = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [intent, setIntent] = useState<DropIntent | null>(null);

  const searching = query.trim() !== "";
  const dragDisabled = searching || add !== null || rename !== null;
  const tabbableId = rows.some((row) => row.node.id === selectedId)
    ? selectedId
    : (rows[0]?.node.id ?? null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: HOLD_MS, tolerance: HOLD_TOLERANCE },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: HOLD_MS, tolerance: HOLD_TOLERANCE },
    }),
  );

  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    const row = treeRef.current?.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
    row?.focus();
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedId, rows]);

  useEffect(() => {
    if (!activeId || !hoverId || hoverId === activeId) return;
    const row = rows.find((candidate) => candidate.node.id === hoverId);
    if (!row || !row.hasChildren || row.open) return;
    const timer = setTimeout(() => onSetOpen(hoverId, true), HOVER_EXPAND_MS);
    return () => clearTimeout(timer);
  }, [activeId, hoverId, rows, onSetOpen]);

  function resolve(event: DragMoveEvent | DragEndEvent): DropIntent | null {
    const { active, over } = event;
    if (!over) return null;
    const y = startY.current + event.delta.y;
    const fraction = Math.min(1, Math.max(0, (y - over.rect.top) / over.rect.height));
    const context: DropContext = { rows, byId, children: childMap };
    return dropIntent(context, String(active.id), String(over.id), fraction);
  }

  function clearDrag() {
    setActiveId(null);
    setHoverId(null);
    setIntent(null);
  }

  function onDragStart(event: DragStartEvent) {
    startY.current = pointerY(event.activatorEvent);
    setActiveId(String(event.active.id));
  }

  function onDragMove(event: DragMoveEvent) {
    setHoverId(event.over ? String(event.over.id) : null);
    const next = resolve(event);
    setIntent((current) =>
      current?.kind === next?.kind && current?.targetId === next?.targetId ? current : next,
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const next = resolve(event);
    const id = String(event.active.id);
    clearDrag();
    if (!next) return;
    const args = moveArgsFor({ byId, children: childMap }, id, next);
    if (args) onMove(id, args);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && activeId) {
      event.stopPropagation();
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.getAttribute("role") !== "treeitem") return;
    const id = target.dataset.nodeId;
    if (!id) return;
    if (event.key === "F2") {
      event.preventDefault();
      onRenameRequest(id);
      return;
    }
    const action = treeKeyAction(rows, id, event.key, searching);
    if (!action) return;
    event.preventDefault();
    focusId.current = action.id;
    if (action.type !== "select") onSetOpen(action.id, action.type === "expand");
    onSelect(action.id);
  }

  const addDepth = (() => {
    if (!add || add.parentId === null) return 0;
    const parentRow = rows.find((row) => row.node.id === add.parentId);
    return parentRow ? parentRow.depth + 1 : null;
  })();

  const addRow: ReactNode =
    add && addDepth !== null ? (
      <SubjectsAddRow
        key="add"
        depth={addDepth}
        isSubject={add.parentId === null}
        names={add.names}
        pending={add.pending}
        onSubmit={add.onSubmit}
        onCancel={add.onCancel}
      />
    ) : null;

  const activeNode = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={clearDrag}
    >
      <div
        ref={treeRef}
        role="tree"
        aria-label={messages.subjectsTreeLabel}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) onSelect(null);
        }}
        className="-mx-2 min-h-40"
      >
        {add?.parentId === null ? addRow : null}
        {rows.map((row) => {
          const id = row.node.id;
          return (
            <Fragment key={id}>
              <SubjectsTreeRow
                row={row}
                color={colorOf(id)}
                query={query}
                selected={id === selectedId}
                tabbable={id === tabbableId}
                dragDisabled={dragDisabled}
                dropKind={intent?.targetId === id ? intent.kind : null}
                rename={
                  rename?.id === id
                    ? {
                        names: rename.names,
                        onSubmit: rename.onSubmit,
                        onCancel: rename.onCancel,
                      }
                    : null
                }
                onSelect={onSelect}
                onToggle={(toggled, open) => {
                  if (!searching) onSetOpen(toggled, open);
                }}
              />
              {add && add.parentId === id ? addRow : null}
            </Fragment>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeNode ? (
          <div className="flex items-center gap-2 rounded-row border border-border bg-surface px-3 py-1.5 text-ui font-semibold">
            <Swatch color={colorOf(activeNode.id)} />
            <span className="truncate">{activeNode.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
