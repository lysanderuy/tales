import { describe, expect, it } from "vitest";

import { buildReport, type ReportNode } from "./breakdown";

const node = (id: string, parentId: string | null, position = 0, archived = false): ReportNode => ({
  id,
  parentId,
  name: id,
  position,
  archived,
});

const nodes: ReportNode[] = [
  node("hema", null, 0),
  node("rbc", "hema", 0),
  node("wbc", "hema", 1),
  node("rbc-a", "rbc", 0),
  node("micro", null, 1),
  node("old", null, 2, true),
];

const range = { fromKey: "2026-01-14", toKey: "2026-01-16" };

describe("buildReport", () => {
  it("groups by root Subject with shares of the total", () => {
    const report = buildReport({
      rows: [
        { date: "2026-01-14", nodeId: "rbc-a", seconds: 3000 },
        { date: "2026-01-15", nodeId: "wbc", seconds: 600 },
        { date: "2026-01-15", nodeId: "micro", seconds: 600 },
      ],
      nodes,
      range,
      scopeId: null,
    });
    expect(report.totalSeconds).toBe(4200);
    expect(report.items.map((item) => item.nodeId)).toEqual(["hema", "micro"]);
    expect(report.items[0].seconds).toBe(3600);
    expect(report.items[0].share).toBeCloseTo(3600 / 4200);
    expect(report.items.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1);
  });

  it("includes every day in the range, empty ones too", () => {
    const report = buildReport({
      rows: [{ date: "2026-01-15", nodeId: "micro", seconds: 60 }],
      nodes,
      range,
      scopeId: null,
    });
    expect(report.days.map((day) => day.date)).toEqual(["2026-01-14", "2026-01-15", "2026-01-16"]);
    expect(report.days[0].items).toEqual([]);
    expect(report.days[1].items).toEqual([{ nodeId: "micro", seconds: 60 }]);
  });

  it("lists Subjects with no time, flagging archived ones", () => {
    const report = buildReport({
      rows: [{ date: "2026-01-15", nodeId: "hema", seconds: 60 }],
      nodes,
      range,
      scopeId: null,
    });
    expect(report.noTimeYet).toEqual([
      { nodeId: "micro", archived: false },
      { nodeId: "old", archived: true },
    ]);
  });

  it("counts archived time in totals and flags the item", () => {
    const report = buildReport({
      rows: [{ date: "2026-01-15", nodeId: "old", seconds: 100 }],
      nodes,
      range,
      scopeId: null,
    });
    expect(report.totalSeconds).toBe(100);
    expect(report.items).toEqual([{ nodeId: "old", seconds: 100, share: 1, archived: true }]);
  });

  it("drills into children at any depth, with a row for time on the node itself", () => {
    const report = buildReport({
      rows: [
        { date: "2026-01-14", nodeId: "hema", seconds: 100 },
        { date: "2026-01-14", nodeId: "rbc", seconds: 200 },
        { date: "2026-01-15", nodeId: "rbc-a", seconds: 300 },
        { date: "2026-01-15", nodeId: "micro", seconds: 999 },
      ],
      nodes,
      range,
      scopeId: "hema",
    });
    expect(report.totalSeconds).toBe(600);
    expect(report.items.map((item) => [item.nodeId, item.seconds])).toEqual([
      ["rbc", 500],
      ["hema", 100],
    ]);
    expect(report.noTimeYet).toEqual([{ nodeId: "wbc", archived: false }]);
    expect(report.days[0].items).toEqual([
      { nodeId: "rbc", seconds: 200 },
      { nodeId: "hema", seconds: 100 },
    ]);

    const deeper = buildReport({
      rows: [{ date: "2026-01-15", nodeId: "rbc-a", seconds: 300 }],
      nodes,
      range,
      scopeId: "rbc",
    });
    expect(deeper.items).toEqual([{ nodeId: "rbc-a", seconds: 300, share: 1, archived: false }]);
  });

  it("reports zero totals and no shares when nothing was studied", () => {
    const report = buildReport({ rows: [], nodes, range, scopeId: null });
    expect(report.totalSeconds).toBe(0);
    expect(report.items).toEqual([]);
    expect(report.noTimeYet).toHaveLength(3);
  });

  it("ignores rows outside the range", () => {
    const report = buildReport({
      rows: [{ date: "2026-01-20", nodeId: "micro", seconds: 60 }],
      nodes,
      range,
      scopeId: null,
    });
    expect(report.totalSeconds).toBe(0);
  });
});
