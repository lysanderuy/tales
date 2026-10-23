export interface SummaryBlock {
  nodeId: string;
  plannedMinutes: number | null;
}

export interface SummaryRecord {
  nodeId: string | null;
  seconds: number;
}

export interface SubjectTotal {
  rootId: string;
  plannedMinutes: number;
  openCount: number;
  studiedSeconds: number;
}

export type RootOf = (nodeId: string) => string | null;

export interface DaySegment {
  rootId: string;
  minutes: number;
}

export const CHART_MAX_HEIGHT = 64;
export const CHART_MIN_HEIGHT = 8;

export function plannedTotal(blocks: readonly SummaryBlock[]): number {
  return blocks.reduce((sum, block) => sum + (block.plannedMinutes ?? 0), 0);
}

export function summarizeByRoot(
  blocks: readonly SummaryBlock[],
  records: readonly SummaryRecord[],
  rootOf: RootOf,
): SubjectTotal[] {
  const totals = new Map<string, SubjectTotal>();
  const entry = (rootId: string): SubjectTotal => {
    let found = totals.get(rootId);
    if (!found) {
      found = { rootId, plannedMinutes: 0, openCount: 0, studiedSeconds: 0 };
      totals.set(rootId, found);
    }
    return found;
  };

  for (const block of blocks) {
    const rootId = rootOf(block.nodeId);
    if (!rootId) continue;
    const total = entry(rootId);
    if (block.plannedMinutes === null) total.openCount += 1;
    else total.plannedMinutes += block.plannedMinutes;
  }
  for (const record of records) {
    const rootId = record.nodeId ? rootOf(record.nodeId) : null;
    if (rootId) entry(rootId).studiedSeconds += record.seconds;
  }

  return [...totals.values()].sort(
    (a, b) => b.plannedMinutes - a.plannedMinutes || b.studiedSeconds - a.studiedSeconds,
  );
}

export function studiedTotalSeconds(totals: readonly SubjectTotal[]): number {
  return totals.reduce((sum, total) => sum + total.studiedSeconds, 0);
}

export function daySegments(blocks: readonly SummaryBlock[], rootOf: RootOf): DaySegment[] {
  const byRoot = new Map<string, number>();
  for (const block of blocks) {
    if (block.plannedMinutes === null) continue;
    const rootId = rootOf(block.nodeId);
    if (rootId) byRoot.set(rootId, (byRoot.get(rootId) ?? 0) + block.plannedMinutes);
  }
  return [...byRoot].map(([rootId, minutes]) => ({ rootId, minutes }));
}

export function chartBarHeight(total: number, maxTotal: number): number {
  if (total <= 0 || maxTotal <= 0) return 0;
  return Math.max(CHART_MIN_HEIGHT, Math.round((total / maxTotal) * CHART_MAX_HEIGHT));
}

export function barPercent(value: number, max: number): number {
  return max > 0 ? Math.round((value / max) * 100) : 0;
}

export function progressFill(plannedMinutes: number | null, progressSeconds: number): number {
  if (!plannedMinutes) return 0;
  return Math.min(100, Math.round((progressSeconds / (plannedMinutes * 60)) * 100));
}
