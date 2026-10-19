import { isDescendant, rootIdOf, type OutlineRow } from "@/lib/outline/tree";

export interface PlannedBlock {
  nodeId: string;
  plannedMinutes: number | null;
}

export interface PlannedSummary {
  rootId: string;
  plannedMinutes: number;
  openCount: number;
}

// Flow 6: remaining minutes rounded up, or null for an open timer.
export function playMinutes(plannedMinutes: number | null, progressSeconds: number): number | null {
  if (plannedMinutes === null) return null;
  const remainingSeconds = plannedMinutes * 60 - progressSeconds;
  if (remainingSeconds <= 0) return null;
  return Math.ceil(remainingSeconds / 60);
}

export function keepsBlockLink(
  rows: readonly OutlineRow[],
  blockNodeId: string,
  pickedNodeId: string,
): boolean {
  return pickedNodeId === blockNodeId || isDescendant(rows, blockNodeId, pickedNodeId);
}

export function summarizePlanned(
  rows: readonly OutlineRow[],
  blocks: readonly PlannedBlock[],
): PlannedSummary[] {
  const byRoot = new Map<string, PlannedSummary>();
  for (const block of blocks) {
    const rootId = rootIdOf(rows, block.nodeId);
    if (!rootId) continue;
    let entry = byRoot.get(rootId);
    if (!entry) {
      entry = { rootId, plannedMinutes: 0, openCount: 0 };
      byRoot.set(rootId, entry);
    }
    if (block.plannedMinutes === null) entry.openCount += 1;
    else entry.plannedMinutes += block.plannedMinutes;
  }
  return [...byRoot.values()];
}

// Moves movedId to index within ids (index clamped); other ids keep their order.
export function orderAfterMove(ids: readonly string[], movedId: string, index: number): string[] {
  const rest = ids.filter((id) => id !== movedId);
  const at = Math.max(0, Math.min(index, rest.length));
  rest.splice(at, 0, movedId);
  return rest;
}
