import { describe, expect, it } from "vitest";

import {
  barPercent,
  chartBarHeight,
  daySegments,
  plannedTotal,
  progressFill,
  studiedTotalSeconds,
  summarizeByRoot,
} from "./summary";

const roots: Record<string, string> = { a1: "A", a2: "A", b1: "B", c1: "C" };
const rootOf = (nodeId: string) => roots[nodeId] ?? null;

describe("plannedTotal", () => {
  it("sums planned minutes and ignores open-ended blocks", () => {
    expect(
      plannedTotal([
        { nodeId: "a1", plannedMinutes: 60 },
        { nodeId: "b1", plannedMinutes: null },
        { nodeId: "a2", plannedMinutes: 30 },
      ]),
    ).toBe(90);
  });
});

describe("summarizeByRoot", () => {
  it("groups planned, open and studied time by root subject", () => {
    const result = summarizeByRoot(
      [
        { nodeId: "a1", plannedMinutes: 60 },
        { nodeId: "a2", plannedMinutes: 30 },
        { nodeId: "b1", plannedMinutes: null },
        { nodeId: "b1", plannedMinutes: null },
      ],
      [
        { nodeId: "a1", seconds: 1800 },
        { nodeId: "c1", seconds: 600 },
        { nodeId: null, seconds: 999 },
        { nodeId: "unknown", seconds: 999 },
      ],
      rootOf,
    );
    expect(result).toEqual([
      { rootId: "A", plannedMinutes: 90, openCount: 0, studiedSeconds: 1800 },
      { rootId: "C", plannedMinutes: 0, openCount: 0, studiedSeconds: 600 },
      { rootId: "B", plannedMinutes: 0, openCount: 2, studiedSeconds: 0 },
    ]);
  });

  it("returns nothing when there is nothing to summarize", () => {
    expect(summarizeByRoot([], [], rootOf)).toEqual([]);
  });

  it("sums studied seconds across totals", () => {
    const totals = summarizeByRoot(
      [],
      [
        { nodeId: "a1", seconds: 60 },
        { nodeId: "b1", seconds: 90 },
      ],
      rootOf,
    );
    expect(studiedTotalSeconds(totals)).toBe(150);
  });
});

describe("daySegments", () => {
  it("stacks planned minutes by root and skips open-ended blocks", () => {
    expect(
      daySegments(
        [
          { nodeId: "a1", plannedMinutes: 45 },
          { nodeId: "a2", plannedMinutes: 15 },
          { nodeId: "b1", plannedMinutes: null },
          { nodeId: "c1", plannedMinutes: 30 },
        ],
        rootOf,
      ),
    ).toEqual([
      { rootId: "A", minutes: 60 },
      { rootId: "C", minutes: 30 },
    ]);
  });
});

describe("chartBarHeight", () => {
  it("scales to 64px with an 8px floor", () => {
    expect(chartBarHeight(90, 90)).toBe(64);
    expect(chartBarHeight(45, 90)).toBe(32);
    expect(chartBarHeight(5, 90)).toBe(8);
  });

  it("is zero for an empty day", () => {
    expect(chartBarHeight(0, 90)).toBe(0);
    expect(chartBarHeight(30, 0)).toBe(0);
  });
});

describe("barPercent and progressFill", () => {
  it("computes rounded percentages safely", () => {
    expect(barPercent(30, 120)).toBe(25);
    expect(barPercent(30, 0)).toBe(0);
    expect(progressFill(60, 1800)).toBe(50);
    expect(progressFill(60, 7200)).toBe(100);
    expect(progressFill(null, 600)).toBe(0);
  });
});
