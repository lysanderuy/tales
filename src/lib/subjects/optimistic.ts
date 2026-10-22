import { nextColorIndex } from "@/lib/outline/tree";
import { buildChildrenMap, buildNodeMap, isInSubtree, type SubjectNode } from "@/lib/subjects/tree";

export function applyMove(
  nodes: readonly SubjectNode[],
  id: string,
  parentId: string | null,
  position?: number,
): SubjectNode[] {
  const byId = buildNodeMap(nodes);
  const node = byId.get(id);
  const newParent = parentId === null ? null : (byId.get(parentId) ?? undefined);
  if (!node || newParent === undefined || (parentId !== null && isInSubtree(byId, parentId, id))) {
    return [...nodes];
  }

  const children = buildChildrenMap(nodes);
  const siblings = (children.get(parentId) ?? []).filter((sibling) => sibling.id !== id);
  const index = Math.min(position ?? siblings.length, siblings.length);
  const reordered = [...siblings];
  reordered.splice(index, 0, node);

  const positions = new Map<string, number>();
  reordered.forEach((sibling, i) => positions.set(sibling.id, i));
  if (node.parentId !== parentId) {
    (children.get(node.parentId) ?? [])
      .filter((sibling) => sibling.id !== id)
      .forEach((sibling, i) => positions.set(sibling.id, i));
  }

  let colorIndex = node.colorIndex;
  if (newParent) colorIndex = newParent.colorIndex;
  else if (node.parentId !== null) {
    colorIndex = nextColorIndex(
      nodes
        .filter((root) => root.parentId === null && root.id !== id)
        .map((root) => root.colorIndex),
    );
  }

  const updated = new Map<string, SubjectNode>();
  const walk = (current: SubjectNode, parent: SubjectNode | null) => {
    const next: SubjectNode = {
      ...current,
      parentId: current.id === id ? parentId : current.parentId,
      position: positions.get(current.id) ?? current.position,
      colorIndex,
      path: [...(parent?.path ?? []), current.name],
      effectivelyArchived: current.archived || (parent?.effectivelyArchived ?? false),
    };
    updated.set(current.id, next);
    for (const kid of children.get(current.id) ?? []) walk(kid, next);
  };
  walk(node, newParent);

  return nodes.map((current) => {
    const moved = updated.get(current.id);
    if (moved) return moved;
    const place = positions.get(current.id);
    return place === undefined ? current : { ...current, position: place };
  });
}
