import "server-only";

import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { buildReport } from "@/lib/reports/breakdown";
import { resolveRange } from "@/lib/reports/ranges";
import { outlineNodeService } from "@/services/outline-node.service";
import { studySessionService } from "@/services/study-session.service";
import { loadUserClock } from "@/services/today.service";
import type { ReportQuery, ReportResponse } from "@/validators/report.validator";

export const reportService = {
  async get(userId: string, query: ReportQuery): Promise<ReportResponse> {
    const { timeZone, todayKey } = await loadUserClock(userId);
    const nodes = await outlineNodeService.list(userId, {
      includeArchived: true,
      includeTotals: false,
    });
    if (query.nodeId && !nodes.some((node) => node.id === query.nodeId)) {
      throw new AppError(404, messages.notFound);
    }

    const earliestKey =
      query.range === "all" ? await studySessionService.earliestStartDate(userId, timeZone) : null;
    const range = resolveRange({
      range: query.range,
      from: query.from,
      to: query.to,
      todayKey,
      earliestKey,
    });

    const rows = await studySessionService.totalsByDayAndNode(
      userId,
      { from: range.fromKey, to: range.toKey },
      timeZone,
    );

    return buildReport({
      rows,
      nodes: nodes.map((node) => ({ ...node, archived: node.effectivelyArchived })),
      range,
      scopeId: query.nodeId ?? null,
    });
  },
};
