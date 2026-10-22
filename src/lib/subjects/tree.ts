import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export type SubjectNode = OutlineNodeResponse;
export type ChildrenMap = ReadonlyMap<string | null, readonly SubjectNode[]>;
export type NodeMap = ReadonlyMap<string, SubjectNode>;

export interface SubjectRow {
  node: SubjectNode;
  depth: number;
  hasChildren: boolean;
  open: boolean;
}

export interface VisibleRowsOptions {
  children: ChildrenMap;
  byId: NodeMap;
  expanded: ReadonlySet<string>;
  query: string;
  showArchived: boolean;
}

export type TreeKeyAction =
  | { type: "select"; id: string }
  | { type: "expand"; id: string }
  | { type: "collapse"; id: string };

export function buildChildrenMap(nodes: readonly SubjectNode[]): ChildrenMap {
  const groups = new Map<string | null, SubjectNode[]>();
  for (const node of nodes) {
    const siblings = groups.get(node.parentId);
    if (siblings) siblings.push(node);
    else groups.set(node.parentId, [node]);
  }
  for (const siblings of groups.values()) siblings.sort((a, b) => a.position - b.position);
  return groups;
}

export function buildNodeMap(nodes: readonly SubjectNode[]): NodeMap {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function ancestorIds(byId: NodeMap, id: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>([id]);
  let parentId = byId.get(id)?.parentId ?? null;
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    chain.unshift(parentId);
    parentId = byId.get(parentId)?.parentId ?? null;
  }
  return chain;
}

export function isInSubtree(byId: NodeMap, id: string, rootId: string): boolean {
  return id === rootId || ancestorIds(byId, id).includes(rootId);
}

export function countItems(nodes: readonly SubjectNode[]): { subjects: number; topics: number } {
  const subjects = nodes.filter((node) => node.parentId === null).length;
  return { subjects, topics: nodes.length - subjects };
}

function matchingIds(options: VisibleRowsOptions, query: string): Set<string> {
  const needle = query.toLowerCase();
  const keep = new Set<string>();
  for (const node of options.byId.values()) {
    if (!options.showArchived && node.effectivelyArchived) continue;
    if (!node.name.toLowerCase().includes(needle)) continue;
    keep.add(node.id);
    for (const ancestor of ancestorIds(options.byId, node.id)) keep.add(ancestor);
  }
  return keep;
}

export function visibleRows(options: VisibleRowsOptions): SubjectRow[] {
  const query = options.query.trim();
  const keep = query ? matchingIds(options, query) : null;
  const rows: SubjectRow[] = [];

  const visibleChildren = (id: string | null) =>
    (options.children.get(id) ?? []).filter(
      (node) => (options.showArchived || !node.effectivelyArchived) && (!keep || keep.has(node.id)),
    );

  const walk = (node: SubjectNode, depth: number) => {
    const kids = visibleChildren(node.id);
    const open = keep ? true : options.expanded.has(node.id);
    rows.push({ node, depth, hasChildren: kids.length > 0, open });
    if (open) for (const kid of kids) walk(kid, depth + 1);
  };

  for (const root of visibleChildren(null)) walk(root, 0);
  return rows;
}

export function highlightParts(
  name: string,
  query: string,
): { before: string; match: string; after: string } | null {
  const needle = query.trim();
  if (!needle) return null;
  const start = name.toLowerCase().indexOf(needle.toLowerCase());
  if (start < 0) return null;
  const end = start + needle.length;
  return { before: name.slice(0, start), match: name.slice(start, end), after: name.slice(end) };
}

export function treeKeyAction(
  rows: readonly SubjectRow[],
  currentId: string,
  key: string,
  searching: boolean,
): TreeKeyAction | null {
  const index = rows.findIndex((row) => row.node.id === currentId);
  const current = rows[index];
  if (!current) return null;

  switch (key) {
    case "ArrowDown":
      return index < rows.length - 1 ? { type: "select", id: rows[index + 1].node.id } : null;
    case "ArrowUp":
      return index > 0 ? { type: "select", id: rows[index - 1].node.id } : null;
    case "ArrowRight":
      if (searching || !current.hasChildren) return null;
      return current.open
        ? { type: "select", id: rows[index + 1].node.id }
        : { type: "expand", id: currentId };
    case "ArrowLeft":
      if (searching) return null;
      if (current.hasChildren && current.open) return { type: "collapse", id: currentId };
      return current.node.parentId ? { type: "select", id: current.node.parentId } : null;
    case "Enter":
    case " ":
      return { type: "select", id: currentId };
    default:
      return null;
  }
}

export function countDescendants(children: ChildrenMap, id: string): number {
  let count = 0;
  for (const kid of children.get(id) ?? []) count += 1 + countDescendants(children, kid.id);
  return count;
}

export interface MoveTarget {
  node: SubjectNode;
  depth: number;
  hasChildren: boolean;
}

export function moveTargets(children: ChildrenMap, excludeId: string): MoveTarget[] {
  const targets: MoveTarget[] = [];
  const walk = (node: SubjectNode, depth: number) => {
    if (node.id === excludeId || node.effectivelyArchived) return;
    const kids = (children.get(node.id) ?? []).filter(
      (kid) => kid.id !== excludeId && !kid.effectivelyArchived,
    );
    targets.push({ node, depth, hasChildren: kids.length > 0 });
    for (const kid of kids) walk(kid, depth + 1);
  };
  for (const root of children.get(null) ?? []) walk(root, 0);
  return targets;
}
