import { describe, expect, it } from "vitest";

import {
  buildTree,
  descendantIds,
  isDescendant,
  nextColorIndex,
  orderedRows,
  pathOf,
  rollUp,
  rootIdOf,
  type OutlineRow,
} from "./tree";

const row = (id: string, parentId: string | null, position: number, name = id): OutlineRow => ({
  id,
  parentId,
  name,
  position,
});

// s -> a -> b -> c -> d -> e -> f (7 levels), plus s -> x, and a second root t
const rows: OutlineRow[] = [
  row("f", "e", 0),
  row("e", "d", 0),
  row("d", "c", 0),
  row("c", "b", 0),
  row("b", "a", 0),
  row("a", "s", 1),
  row("x", "s", 0),
  row("s", null, 0, "Subject"),
  row("t", null, 1),
];

describe("buildTree and orderedRows", () => {
  it("nests rows and orders siblings by position", () => {
    const tree = buildTree(rows);
    expect(tree.map((n) => n.id)).toEqual(["s", "t"]);
    expect(tree[0].children.map((n) => n.id)).toEqual(["x", "a"]);
    let node = tree[0].children[1];
    let depth = 2;
    while (node.children.length > 0) {
      node = node.children[0];
      depth++;
    }
    expect(node.id).toBe("f");
    expect(depth).toBe(7);
  });

  it("lists rows depth-first with parents before children", () => {
    expect(orderedRows(rows).map((r) => r.id)).toEqual([
      "s",
      "x",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "t",
    ]);
  });
});

describe("pathOf and rootIdOf", () => {
  it("returns names from the root down", () => {
    expect(pathOf(rows, "f")).toEqual(["Subject", "a", "b", "c", "d", "e", "f"]);
    expect(pathOf(rows, "s")).toEqual(["Subject"]);
    expect(pathOf(rows, "missing")).toEqual([]);
  });

  it("finds the root", () => {
    expect(rootIdOf(rows, "f")).toBe("s");
    expect(rootIdOf(rows, "t")).toBe("t");
  });
});

describe("descendants and move checks", () => {
  it("collects every descendant", () => {
    expect(descendantIds(rows, "b").sort()).toEqual(["c", "d", "e", "f"]);
    expect(descendantIds(rows, "t")).toEqual([]);
  });

  it("blocks moves under self or own descendants", () => {
    expect(isDescendant(rows, "b", "f")).toBe(true);
    expect(isDescendant(rows, "b", "b")).toBe(false);
    expect(isDescendant(rows, "f", "b")).toBe(false);
    expect(isDescendant(rows, "x", "f")).toBe(false);
  });

  it("reflects a move in later lookups", () => {
    const moved = rows.map((r) => (r.id === "b" ? { ...r, parentId: "t" } : r));
    expect(pathOf(moved, "f")).toEqual(["t", "b", "c", "d", "e", "f"]);
    expect(rootIdOf(moved, "f")).toBe("t");
    expect(isDescendant(moved, "a", "f")).toBe(false);
    expect(isDescendant(moved, "t", "f")).toBe(true);
  });

  it("survives a corrupt cycle without looping", () => {
    const cyclic = [row("p", "q", 0), row("q", "p", 0)];
    expect(pathOf(cyclic, "p").length).toBeLessThanOrEqual(2);
    expect(rootIdOf(cyclic, "p")).toBeUndefined();
  });
});

describe("nextColorIndex", () => {
  it("picks the smallest unused index", () => {
    expect(nextColorIndex([])).toBe(0);
    expect(nextColorIndex([0, 1, 3])).toBe(2);
    expect(nextColorIndex([1, 2])).toBe(0);
  });

  it("cycles by count once all eight are used", () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7];
    expect(nextColorIndex(all)).toBe(0);
    expect(nextColorIndex([...all, 0])).toBe(1);
    expect(nextColorIndex([...all, 0, 1, 2])).toBe(3);
  });
});

describe("rollUp", () => {
  const direct = new Map([
    ["s", 10],
    ["a", 20],
    ["f", 100],
    ["t", 5],
  ]);
  const last = new Map([
    ["a", new Date("2026-03-01T00:00:00Z")],
    ["f", new Date("2026-02-01T00:00:00Z")],
    ["t", new Date("2026-04-01T00:00:00Z")],
  ]);

  it("sums own and descendant time through six levels", () => {
    const result = rollUp(rows, direct, last);
    expect(result.get("f")).toMatchObject({ totalSeconds: 100, ownSeconds: 100 });
    expect(result.get("b")).toMatchObject({ totalSeconds: 100, ownSeconds: 0 });
    expect(result.get("a")).toMatchObject({ totalSeconds: 120, ownSeconds: 20 });
    expect(result.get("s")).toMatchObject({ totalSeconds: 130, ownSeconds: 10 });
    expect(result.get("t")?.totalSeconds).toBe(5);
  });

  it("takes the latest studied date among self and descendants", () => {
    const result = rollUp(rows, direct, last);
    expect(result.get("s")?.lastStudiedAt).toEqual(new Date("2026-03-01T00:00:00Z"));
    expect(result.get("b")?.lastStudiedAt).toEqual(new Date("2026-02-01T00:00:00Z"));
    expect(result.get("x")?.lastStudiedAt).toBeNull();
  });

  it("updates old and new parents after a move", () => {
    const moved = rows.map((r) => (r.id === "a" ? { ...r, parentId: "t" } : r));
    const result = rollUp(moved, direct, last);
    expect(result.get("s")?.totalSeconds).toBe(10);
    expect(result.get("t")?.totalSeconds).toBe(125);
    expect(result.get("t")?.lastStudiedAt).toEqual(new Date("2026-04-01T00:00:00Z"));
  });
});
