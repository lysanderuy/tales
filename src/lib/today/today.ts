export interface TodayBlock {
  id: string;
  nodeId: string;
  plannedMinutes: number | null;
}

export interface TodayRecord {
  id: string;
  blockId: string | null;
  nodeId: string | null;
  startedAt: Date;
  startClock: string;
  endClock: string | null;
  seconds: number;
  live: boolean;
}

export interface TodayTime {
  startClock: string;
  endClock: string | null;
}

export interface PlannedRow {
  kind: "planned";
  blockId: string;
  nodeId: string;
  plannedMinutes: number | null;
  progressSeconds: number;
  times: TodayTime[];
  live: boolean;
}

export interface FreeRow {
  kind: "free";
  recordId: string;
  nodeId: string | null;
  seconds: number;
  startClock: string;
  endClock: string | null;
  live: boolean;
  pending: boolean;
}

export type TodayRow = PlannedRow | FreeRow;

export interface NextUp {
  blockId: string;
  nodeId: string;
  minutesLeft: number | null;
}

// blocks arrive in plan order. A record belongs to a planned row only when its block is on today's date.
export function assembleToday(input: {
  blocks: readonly TodayBlock[];
  progressByBlockId: ReadonlyMap<string, number>;
  records: readonly TodayRecord[];
}): TodayRow[] {
  const blockIds = new Set(input.blocks.map((block) => block.id));
  const records = [...new Map(input.records.map((record) => [record.id, record])).values()];

  const planned: PlannedRow[] = input.blocks.map((block) => {
    const mine = records
      .filter((record) => record.blockId === block.id)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    return {
      kind: "planned",
      blockId: block.id,
      nodeId: block.nodeId,
      plannedMinutes: block.plannedMinutes,
      progressSeconds: input.progressByBlockId.get(block.id) ?? 0,
      times: mine.map((record) => ({ startClock: record.startClock, endClock: record.endClock })),
      live: mine.some((record) => record.live),
    };
  });

  const free: FreeRow[] = records
    .filter((record) => record.blockId === null || !blockIds.has(record.blockId))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .map((record) => ({
      kind: "free",
      recordId: record.id,
      nodeId: record.nodeId,
      seconds: record.seconds,
      startClock: record.startClock,
      endClock: record.endClock,
      live: record.live,
      pending: !record.live && record.nodeId === null,
    }));

  return [...planned, ...free];
}

export function hasPlannedTimeLeft(
  plannedMinutes: number | null,
  progressSeconds: number,
): boolean {
  return plannedMinutes === null ? progressSeconds === 0 : progressSeconds < plannedMinutes * 60;
}

export function pickNextUp(
  todayBlocks: readonly TodayBlock[],
  progressByBlockId: ReadonlyMap<string, number>,
  excludeBlockId?: string,
): NextUp | null {
  for (const block of todayBlocks) {
    if (block.id === excludeBlockId) continue;
    const progress = progressByBlockId.get(block.id) ?? 0;
    if (!hasPlannedTimeLeft(block.plannedMinutes, progress)) continue;
    return {
      blockId: block.id,
      nodeId: block.nodeId,
      minutesLeft:
        block.plannedMinutes === null
          ? null
          : Math.ceil((block.plannedMinutes * 60 - progress) / 60),
    };
  }
  return null;
}
