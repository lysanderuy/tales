import { messages } from "@/lib/messages";
import { addDays } from "@/lib/time/zone";
import { formatEventDate, formatProgress } from "@/lib/today/format";
import { formatPath, subjectColor } from "@/lib/today/subject-index";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";
import type { PickerResponse } from "@/validators/today.validator";

export type PickerTreeNode = Pick<
  OutlineNodeResponse,
  "id" | "parentId" | "name" | "position" | "colorIndex" | "path" | "effectivelyArchived"
>;

export interface PickerSelection {
  nodeId: string | null;
  blockId: string | null;
}

export interface PickerRow {
  key: string;
  nodeId: string;
  blockId: string | null;
  name: string;
  sub: string | null;
  color: string;
  right: string | null;
  expandable: boolean;
}

export interface TopicRow {
  nodeId: string;
  name: string;
  depth: number;
  isParent: boolean;
}

export interface HomeGroups {
  planned: PickerRow[];
  recent: PickerRow[];
  subjects: PickerRow[];
}

export interface SearchGroups {
  planned: PickerRow[];
  results: PickerRow[];
}

const RECENT_LIMIT = 3;

export function activeNodeMap(nodes: readonly PickerTreeNode[]): Map<string, PickerTreeNode> {
  return new Map(nodes.filter((node) => !node.effectivelyArchived).map((n) => [n.id, n]));
}

export function plannedTag(date: string, todayDate: string | undefined): string | null {
  if (todayDate === undefined || date === todayDate) return null;
  return date === addDays(todayDate, -1) ? messages.pickerYesterday : formatEventDate(date);
}

function ancestorPath(node: PickerTreeNode): string | null {
  return node.path.length > 1 ? formatPath(node.path.slice(0, -1)) : null;
}

function nodeRow(kind: string, node: PickerTreeNode, sub: string | null): PickerRow {
  return {
    key: `${kind}:${node.id}`,
    nodeId: node.id,
    blockId: null,
    name: node.name,
    sub,
    color: subjectColor(node.colorIndex),
    right: null,
    expandable: false,
  };
}

function plannedRows(
  planned: PickerResponse["planned"],
  active: ReadonlyMap<string, PickerTreeNode>,
  todayDate: string | undefined,
): PickerRow[] {
  const rows: PickerRow[] = [];
  for (const item of planned) {
    const node = active.get(item.nodeId);
    if (!node) continue;
    const sub = [plannedTag(item.date, todayDate), ancestorPath(node)].filter(Boolean).join(" · ");
    rows.push({
      ...nodeRow("planned", node, sub || null),
      key: `planned:${item.blockId}`,
      blockId: item.blockId,
      right: formatProgress(item.plannedMinutes, item.progressSeconds),
    });
  }
  return rows;
}

export function buildHomeGroups(
  data: PickerResponse,
  nodes: readonly PickerTreeNode[],
  todayDate: string | undefined,
): HomeGroups {
  const active = activeNodeMap(nodes);
  const planned = plannedRows(data.planned, active, todayDate);
  const shown = new Set(planned.map((row) => row.nodeId));

  const recent: PickerRow[] = [];
  for (const item of data.recent ?? []) {
    const node = active.get(item.id);
    if (!node || shown.has(node.id)) continue;
    recent.push(nodeRow("recent", node, ancestorPath(node)));
    if (recent.length === RECENT_LIMIT) break;
  }

  const subjects = [...active.values()]
    .filter((node) => node.parentId === null)
    .sort((a, b) => a.position - b.position)
    .map((node) => ({ ...nodeRow("subject", node, null), expandable: true }));

  return { planned, recent, subjects };
}

export function buildSearchGroups(
  data: PickerResponse,
  nodes: readonly PickerTreeNode[],
  todayDate: string | undefined,
): SearchGroups {
  const active = activeNodeMap(nodes);
  const results: PickerRow[] = [];
  for (const item of data.nodes ?? []) {
    const node = active.get(item.id);
    if (node) results.push(nodeRow("result", node, ancestorPath(node)));
  }
  return { planned: plannedRows(data.planned, active, todayDate), results };
}

export function topicRows(nodes: readonly PickerTreeNode[], rootId: string): TopicRow[] {
  const children = new Map<string, PickerTreeNode[]>();
  for (const node of nodes) {
    if (node.effectivelyArchived || node.parentId === null) continue;
    const siblings = children.get(node.parentId);
    if (siblings) siblings.push(node);
    else children.set(node.parentId, [node]);
  }

  const rows: TopicRow[] = [];
  const walk = (parentId: string, depth: number) => {
    const siblings = [...(children.get(parentId) ?? [])].sort((a, b) => a.position - b.position);
    for (const node of siblings) {
      rows.push({ nodeId: node.id, name: node.name, depth, isParent: children.has(node.id) });
      walk(node.id, depth + 1);
    }
  };
  walk(rootId, 0);
  return rows;
}

export function isPicked(
  row: { nodeId: string; blockId: string | null },
  selected: PickerSelection,
): boolean {
  return row.blockId !== null
    ? row.blockId === selected.blockId
    : row.nodeId === selected.nodeId && selected.blockId === null;
}
