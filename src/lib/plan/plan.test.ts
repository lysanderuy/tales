import { describe, expect, it } from "vitest";

import type { OutlineRow } from "@/lib/outline/tree";

import { keepsBlockLink, orderAfterMove, playMinutes, summarizePlanned } from "./plan";

const row = (id: string, parentId: string | null, position = 0): OutlineRow => ({
  id,
  parentId,
  name: id,
  position,
});

const rows: OutlineRow[] = [
  row("hema", null),
  row("l1", "hema"),
  row("l2", "l1"),
  row("l3", "l2"),
  row("l4", "l3"),
  row("l5", "l4"),
  row("l6", "l5"),
  row("chem", null, 1),
  row("chem-a", "chem"),
];

describe("playMinutes", () => {
  it("is open when there is no plan", () => {
    expect(playMinutes(null, 0)).toBeNull();
    expect(playMinutes(null, 9999)).toBeNull();
  });
  it("is the full plan with no progress", () => {
    expect(playMinutes(60, 0)).toBe(60);
  });
  it("is the remaining minutes", () => {
    expect(playMinutes(60, 35 * 60)).toBe(25);
  });
  it("rounds the remainder up", () => {
    expect(playMinutes(60, 35 * 60 + 1)).toBe(25);
    expect(playMinutes(60, 59 * 60 + 30)).toBe(1);
  });
  it("is open when progress equals the plan", () => {
    expect(playMinutes(60, 3600)).toBeNull();
  });
  it("is open when progress passes the plan", () => {
    expect(playMinutes(60, 3601)).toBeNull();
    expect(playMinutes(60, 4500)).toBeNull();
  });
});

describe("keepsBlockLink", () => {
  it("keeps the link for the block's own item", () => {
    expect(keepsBlockLink(rows, "hema", "hema")).toBe(true);
  });
  it("keeps the link for a topic six levels deep", () => {
    expect(keepsBlockLink(rows, "hema", "l6")).toBe(true);
  });
  it("drops the link for an item outside", () => {
    expect(keepsBlockLink(rows, "hema", "chem-a")).toBe(false);
    expect(keepsBlockLink(rows, "l3", "l1")).toBe(false);
    expect(keepsBlockLink(rows, "l3", "hema")).toBe(false);
  });
});

describe("summarizePlanned", () => {
  it("rolls topics up to their root and counts open items", () => {
    const result = summarizePlanned(rows, [
      { nodeId: "l6", plannedMinutes: 30 },
      { nodeId: "hema", plannedMinutes: 45 },
      { nodeId: "l2", plannedMinutes: null },
      { nodeId: "chem-a", plannedMinutes: null },
    ]);
    expect(result).toEqual([
      { rootId: "hema", plannedMinutes: 75, openCount: 1 },
      { rootId: "chem", plannedMinutes: 0, openCount: 1 },
    ]);
  });
  it("skips unknown items and returns nothing for no blocks", () => {
    expect(summarizePlanned(rows, [{ nodeId: "ghost", plannedMinutes: 10 }])).toEqual([]);
    expect(summarizePlanned(rows, [])).toEqual([]);
  });
});

describe("orderAfterMove", () => {
  it("moves an id to a place", () => {
    expect(orderAfterMove(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
    expect(orderAfterMove(["a", "b", "c"], "a", 1)).toEqual(["b", "a", "c"]);
  });
  it("clamps the index and appends new ids", () => {
    expect(orderAfterMove(["a", "b"], "a", 99)).toEqual(["b", "a"]);
    expect(orderAfterMove(["a", "b"], "z", 1)).toEqual(["a", "z", "b"]);
    expect(orderAfterMove(["a", "b"], "z", -3)).toEqual(["z", "a", "b"]);
  });
});
