import { isInSubtree, type ChildrenMap, type NodeMap, type SubjectRow } from "@/lib/subjects/tree";

export type DropKind = "before" | "after" | "inside";

export interface DropIntent {
  kind: DropKind;
  targetId: string;
}

export interface MoveArgs {
  parentId: string | null;
  position: number;
}

export interface DropContext {
  rows: readonly SubjectRow[];
  byId: NodeMap;
  children: ChildrenMap;
}

export function kindFromFraction(fraction: number): DropKind {
  if (fraction < 0.25) return "before";
  if (fraction > 0.75) return "after";
  return "inside";
}

export function moveArgsFor(
  context: Pick<DropContext, "byId" | "children">,
  activeId: string,
  intent: DropIntent,
): MoveArgs | null {
  const active = context.byId.get(activeId);
  const target = context.byId.get(intent.targetId);
  if (!active || !target) return null;

  const parentId = intent.kind === "inside" ? target.id : target.parentId;
  const siblings = (context.children.get(parentId) ?? []).filter((node) => node.id !== activeId);
  let position = siblings.length;
  if (intent.kind !== "inside") {
    const at = siblings.findIndex((node) => node.id === target.id);
    if (at < 0) return null;
    position = intent.kind === "before" ? at : at + 1;
  }

  if (parentId === active.parentId) {
    const current = (context.children.get(parentId) ?? []).findIndex(
      (node) => node.id === activeId,
    );
    if (current === position) return null;
  }
  return { parentId, position };
}

export function dropIntent(
  context: DropContext,
  activeId: string,
  overId: string,
  fraction: number,
): DropIntent | null {
  const active = context.byId.get(activeId);
  const over = context.byId.get(overId);
  if (!active || !over || active.effectivelyArchived || over.effectivelyArchived) return null;
  if (isInSubtree(context.byId, overId, activeId)) return null;

  let intent: DropIntent = { kind: kindFromFraction(fraction), targetId: overId };
  if (intent.kind === "after") {
    const index = context.rows.findIndex((row) => row.node.id === overId);
    const row = context.rows[index];
    const next = context.rows[index + 1];
    if (row?.open && row.hasChildren && next) {
      if (next.node.id === activeId) return null;
      intent = { kind: "before", targetId: next.node.id };
    }
  }

  return moveArgsFor(context, activeId, intent) ? intent : null;
}
