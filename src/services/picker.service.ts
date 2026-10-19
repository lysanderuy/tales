import "server-only";

import { desc, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import { studySessions } from "@/db/schema";
import { addDays } from "@/lib/time/zone";
import { blockService } from "@/services/block.service";
import { outlineNodeService } from "@/services/outline-node.service";
import { loadUserClock } from "@/services/today.service";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";
import type { PickerQuery, PickerResponse } from "@/validators/today.validator";

const RECENT_LIMIT = 3;
const SEARCH_LIMIT = 50;
const PATH_SEPARATOR = " › ";

function toPickerNode(node: OutlineNodeResponse) {
  return { id: node.id, path: node.path, colorIndex: node.colorIndex };
}

export const pickerService = {
  async get(userId: string, { q }: PickerQuery): Promise<PickerResponse> {
    const { todayKey } = await loadUserClock(userId);

    const [nodes, blocks] = await Promise.all([
      outlineNodeService.list(userId, { includeArchived: false, includeTotals: false }),
      blockService.list(userId, {
        from: addDays(todayKey, -6),
        to: todayKey,
        limit: 500,
      }),
    ]);
    const visible = new Map(nodes.map((node) => [node.id, node]));
    const needle = q?.toLowerCase();
    const matches = (nodeId: string) => {
      const node = visible.get(nodeId);
      return (
        node !== undefined &&
        (needle === undefined || node.path.join(PATH_SEPARATOR).toLowerCase().includes(needle))
      );
    };

    const toPlanned = (block: (typeof blocks)[number]) => ({
      blockId: block.id,
      nodeId: block.nodeId,
      date: block.date,
      plannedMinutes: block.plannedMinutes,
      progressSeconds: block.progressSeconds,
    });
    const todays = blocks.filter((block) => block.date === todayKey && matches(block.nodeId));
    const earlier = blocks
      .filter(
        (block) =>
          block.date < todayKey &&
          block.plannedMinutes !== null &&
          block.progressSeconds < block.plannedMinutes * 60 &&
          matches(block.nodeId),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    const planned = [...todays, ...earlier].map(toPlanned);

    if (needle !== undefined) {
      return {
        planned,
        nodes: nodes
          .filter((node) => matches(node.id))
          .slice(0, SEARCH_LIMIT)
          .map(toPickerNode),
      };
    }

    const lastUsed = await db
      .select({ nodeId: studySessions.nodeId })
      .from(studySessions)
      .where(
        owned(
          studySessions,
          userId,
          isNotNull(studySessions.endedAt),
          isNotNull(studySessions.nodeId),
        ),
      )
      .groupBy(studySessions.nodeId)
      .orderBy(desc(sql`max(${studySessions.startedAt})`))
      .limit(100);

    const shown = new Set(planned.map((row) => row.nodeId));
    const recent: PickerResponse["recent"] = [];
    for (const { nodeId } of lastUsed) {
      if (recent.length === RECENT_LIMIT) break;
      const node = nodeId ? visible.get(nodeId) : undefined;
      if (node && !shown.has(node.id)) recent.push(toPickerNode(node));
    }
    return { planned, recent };
  },
};
