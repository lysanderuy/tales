export const COLOR_COUNT = 8;

export interface OutlineRow {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
}

export type OutlineTreeNode<T extends OutlineRow> = T & { children: OutlineTreeNode<T>[] };

export interface RolledUp {
  totalSeconds: number;
  ownSeconds: number;
  lastStudiedAt: Date | null;
}

function groupByParent<T extends OutlineRow>(rows: readonly T[]): Map<string | null, T[]> {
  const groups = new Map<string | null, T[]>();
  for (const row of rows) {
    const siblings = groups.get(row.parentId);
    if (siblings) siblings.push(row);
    else groups.set(row.parentId, [row]);
  }
  for (const siblings of groups.values()) siblings.sort((a, b) => a.position - b.position);
  return groups;
}

export function buildTree<T extends OutlineRow>(rows: readonly T[]): OutlineTreeNode<T>[] {
  const groups = groupByParent(rows);
  const attach = (row: T): OutlineTreeNode<T> => ({
    ...row,
    children: (groups.get(row.id) ?? []).map(attach),
  });
  return (groups.get(null) ?? []).map(attach);
}

// Depth-first, siblings by position; parents always precede their children.
export function orderedRows<T extends OutlineRow>(rows: readonly T[]): T[] {
  const groups = groupByParent(rows);
  const out: T[] = [];
  const stack: T[] = [...(groups.get(null) ?? [])].reverse();
  while (stack.length > 0) {
    const row = stack.pop()!;
    out.push(row);
    const children = groups.get(row.id);
    if (children) for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  return out;
}

export function pathOf(rows: readonly OutlineRow[], id: string): string[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const path: string[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

function resolveRoot(byId: ReadonlyMap<string, OutlineRow>, id: string): string | undefined {
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.parentId === null) return current.id;
    current = byId.get(current.parentId);
  }
  return undefined;
}

export function rootIdOf(rows: readonly OutlineRow[], id: string): string | undefined {
  return resolveRoot(new Map(rows.map((row) => [row.id, row])), id);
}

export function rootIdMap(rows: readonly OutlineRow[]): Map<string, string> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const roots = new Map<string, string>();
  for (const row of rows) {
    const rootId = resolveRoot(byId, row.id);
    if (rootId) roots.set(row.id, rootId);
  }
  return roots;
}

export function descendantIds(rows: readonly OutlineRow[], id: string): string[] {
  const groups = groupByParent(rows);
  const out: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of groups.get(current) ?? []) {
      out.push(child.id);
      queue.push(child.id);
    }
  }
  return out;
}

// Strict: a node is not its own descendant.
export function isDescendant(rows: readonly OutlineRow[], ancestorId: string, id: string): boolean {
  return descendantIds(rows, ancestorId).includes(id);
}

export function nextColorIndex(usedRootColorIndexes: readonly number[]): number {
  const used = new Set(usedRootColorIndexes);
  for (let i = 0; i < COLOR_COUNT; i++) if (!used.has(i)) return i;
  return usedRootColorIndexes.length % COLOR_COUNT;
}

export function rollUp(
  rows: readonly OutlineRow[],
  directSecondsById: ReadonlyMap<string, number>,
  lastStudiedAtById: ReadonlyMap<string, Date>,
): Map<string, RolledUp> {
  const result = new Map<string, RolledUp>();
  for (const row of rows) {
    const own = directSecondsById.get(row.id) ?? 0;
    result.set(row.id, {
      totalSeconds: own,
      ownSeconds: own,
      lastStudiedAt: lastStudiedAtById.get(row.id) ?? null,
    });
  }

  // Walking the depth-first order backwards visits every child before its parent.
  const ordered = orderedRows(rows);
  for (let i = ordered.length - 1; i >= 0; i--) {
    const row = ordered[i];
    if (row.parentId === null) continue;
    const child = result.get(row.id);
    const parent = result.get(row.parentId);
    if (!child || !parent) continue;
    parent.totalSeconds += child.totalSeconds;
    if (
      child.lastStudiedAt &&
      (!parent.lastStudiedAt || child.lastStudiedAt > parent.lastStudiedAt)
    ) {
      parent.lastStudiedAt = child.lastStudiedAt;
    }
  }
  return result;
}
