import { describe, expect, it } from "vitest";

import { formatSessionWhen, spansMultipleRoots, totalSessionSeconds } from "./log";

const session = (nodeId: string, seconds: number) => ({
  id: nodeId,
  nodeId,
  seconds,
  startedAt: "2026-03-02T01:15:00.000Z",
  endedAt: "2026-03-02T02:00:00.000Z",
});

describe("totalSessionSeconds", () => {
  it("sums the seconds", () => {
    expect(totalSessionSeconds([session("a", 600), session("b", 90)])).toBe(690);
    expect(totalSessionSeconds([])).toBe(0);
  });
});

describe("spansMultipleRoots", () => {
  const info = (id: string, rootId: string) => ({
    id,
    name: id,
    ancestors: [],
    rootId,
    color: "x",
  });
  const index = new Map([
    ["a", info("a", "r1")],
    ["b", info("b", "r1")],
    ["c", info("c", "r2")],
  ]);

  it("is false under one root subject", () => {
    expect(spansMultipleRoots([session("a", 1), session("b", 1)], index)).toBe(false);
  });

  it("is true across root subjects", () => {
    expect(spansMultipleRoots([session("a", 1), session("c", 1)], index)).toBe(true);
  });
});

describe("formatSessionWhen", () => {
  it("renders the clock range and weekday date in the zone", () => {
    expect(formatSessionWhen(session("a", 1), "Asia/Manila")).toBe("09:15–10:00 · Mon Mar 2");
  });
});
