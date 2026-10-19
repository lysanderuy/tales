import { descendantIds, rootIdOf, type OutlineRow } from "@/lib/outline/tree";
import { daysInRange, type DayRange } from "@/lib/reports/ranges";

export interface DayNodeSeconds {
  date: string;
  nodeId: string;
  seconds: number;
}

export interface ReportNode extends OutlineRow {
  archived: boolean;
}

export interface ReportItem {
  nodeId: string;
  seconds: number;
  share: number;
  archived: boolean;
}

export interface ReportDay {
  date: string;
  items: { nodeId: string; seconds: number }[];
}

export interface ReportBreakdown {
  fromDate: string;
  toDate: string;
  totalSeconds: number;
  items: ReportItem[];
  days: ReportDay[];
  noTimeYet: { nodeId: string; archived: boolean }[];
}

// Maps a recorded node to the group it reports under; null when it is outside the view.
function groupResolver(
  rows: readonly ReportNode[],
  scopeId: string | null,
): (nodeId: string) => string | null {
  if (scopeId === null) return (nodeId) => rootIdOf(rows, nodeId) ?? null;
  const childOf = new Map<string, string>();
  for (const child of rows.filter((row) => row.parentId === scopeId)) {
    childOf.set(child.id, child.id);
    for (const id of descendantIds(rows, child.id)) childOf.set(id, child.id);
  }
  return (nodeId) => (nodeId === scopeId ? scopeId : (childOf.get(nodeId) ?? null));
}

export function buildReport(input: {
  rows: readonly DayNodeSeconds[];
  nodes: readonly ReportNode[];
  range: DayRange;
  scopeId: string | null;
}): ReportBreakdown {
  const { nodes, range, scopeId } = input;
  const groupOf = groupResolver(nodes, scopeId);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const position = new Map(nodes.map((node, index) => [node.id, index]));

  const totals = new Map<string, number>();
  const perDay = new Map<string, Map<string, number>>();
  for (const date of daysInRange(range)) perDay.set(date, new Map());

  for (const row of input.rows) {
    const day = perDay.get(row.date);
    const group = groupOf(row.nodeId);
    if (!day || group === null) continue;
    totals.set(group, (totals.get(group) ?? 0) + row.seconds);
    day.set(group, (day.get(group) ?? 0) + row.seconds);
  }

  const bySecondsThenOrder = (a: { nodeId: string; seconds: number }, b: typeof a) =>
    b.seconds - a.seconds || (position.get(a.nodeId) ?? 0) - (position.get(b.nodeId) ?? 0);

  let totalSeconds = 0;
  for (const seconds of totals.values()) totalSeconds += seconds;

  const items: ReportItem[] = [...totals]
    .filter(([, seconds]) => seconds > 0)
    .map(([nodeId, seconds]) => ({
      nodeId,
      seconds,
      share: totalSeconds > 0 ? seconds / totalSeconds : 0,
      archived: byId.get(nodeId)?.archived ?? false,
    }))
    .sort(bySecondsThenOrder);

  const days: ReportDay[] = [...perDay].map(([date, groups]) => ({
    date,
    items: [...groups]
      .filter(([, seconds]) => seconds > 0)
      .map(([nodeId, seconds]) => ({ nodeId, seconds }))
      .sort(bySecondsThenOrder),
  }));

  const candidates = nodes.filter((node) => node.parentId === scopeId);
  const noTimeYet = candidates
    .filter((node) => (totals.get(node.id) ?? 0) <= 0)
    .sort((a, b) => a.position - b.position)
    .map((node) => ({ nodeId: node.id, archived: node.archived }));

  return {
    fromDate: range.fromKey,
    toDate: range.toKey,
    totalSeconds,
    items,
    days,
    noTimeYet,
  };
}
