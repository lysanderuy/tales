import { describe, expect, it } from "vitest";

import {
  ancestorIds,
  buildChildrenMap,
  buildNodeMap,
  countDescendants,
  countItems,
  highlightParts,
  isInSubtree,
  moveTargets,
  treeKeyAction,
  visibleRows,
  type SubjectNode,
  type VisibleRowsOptions,
} from "./tree";

function node(
  id: string,
  parentId: string | null,
  name: string,
  position: number,
  archived = false,
  effectivelyArchived = archived,
): SubjectNode {
  return {
    id,
    parentId,
    name,
    position,
    examWeight: null,
    archived,
    effectivelyArchived,
    colorIndex: 0,
    path: [name],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const nodes = [
  node("c", "a", "Urine", 1),
  node("a", null, "Clinical Microscopy", 0),
  node("b", "a", "Feces", 0),
  node("d", "c", "Chemical Analyses", 0),
  node("e", "c", "Old Topic", 1, true),
  node("f", "e", "Under archived", 0, false, true),
  node("g", null, "Hematology", 1),
];

const children = buildChildrenMap(nodes);
const byId = buildNodeMap(nodes);

function rowsFor(options: Partial<VisibleRowsOptions>) {
  return visibleRows({
    children,
    byId,
    expanded: new Set(),
    query: "",
    showArchived: false,
    ...options,
  });
}

function idsFor(options: Partial<VisibleRowsOptions>) {
  return rowsFor(options).map((row) => row.node.id);
}

describe("buildChildrenMap", () => {
  it("sorts siblings by position", () => {
    expect(children.get("a")?.map((n) => n.id)).toEqual(["b", "c"]);
    expect(children.get(null)?.map((n) => n.id)).toEqual(["a", "g"]);
  });
});

describe("visibleRows", () => {
  it("shows only roots when nothing is expanded", () => {
    expect(idsFor({})).toEqual(["a", "g"]);
  });

  it("walks expanded branches in order with depth", () => {
    const rows = rowsFor({ expanded: new Set(["a", "c"]) });
    expect(rows.map((r) => [r.node.id, r.depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 1],
      ["d", 2],
      ["g", 0],
    ]);
  });

  it("hides archived branches unless shown", () => {
    const expanded = new Set(["a", "c", "e"]);
    expect(idsFor({ expanded })).not.toContain("e");
    expect(idsFor({ expanded })).not.toContain("f");
    expect(idsFor({ expanded, showArchived: true })).toContain("f");
  });

  it("search keeps matches and ancestors and auto-expands", () => {
    const rows = rowsFor({ query: " chemical " });
    expect(rows.map((r) => r.node.id)).toEqual(["a", "c", "d"]);
    expect(rows.every((r) => !r.hasChildren || r.open)).toBe(true);
  });

  it("search excludes archived matches unless shown", () => {
    expect(idsFor({ query: "under" })).toEqual([]);
    expect(idsFor({ query: "under", showArchived: true })).toEqual(["a", "c", "e", "f"]);
  });

  it("marks hasChildren from the visible children only", () => {
    expect(rowsFor({}).find((r) => r.node.id === "g")?.hasChildren).toBe(false);
    expect(rowsFor({}).find((r) => r.node.id === "a")?.hasChildren).toBe(true);
  });
});

describe("ancestors and subtree", () => {
  it("lists ancestors from the root down", () => {
    expect(ancestorIds(byId, "d")).toEqual(["a", "c"]);
    expect(ancestorIds(byId, "a")).toEqual([]);
  });

  it("checks subtree membership including itself", () => {
    expect(isInSubtree(byId, "d", "a")).toBe(true);
    expect(isInSubtree(byId, "a", "a")).toBe(true);
    expect(isInSubtree(byId, "a", "d")).toBe(false);
  });
});

describe("countItems", () => {
  it("counts roots as Subjects and the rest as Topics", () => {
    expect(countItems(nodes)).toEqual({ subjects: 2, topics: 5 });
  });
});

describe("highlightParts", () => {
  it("splits around the first case-insensitive match", () => {
    expect(highlightParts("Chemical Analyses", "ANAL")).toEqual({
      before: "Chemical ",
      match: "Anal",
      after: "yses",
    });
  });

  it("returns null without a query or match", () => {
    expect(highlightParts("Urine", " ")).toBeNull();
    expect(highlightParts("Urine", "x")).toBeNull();
  });
});

describe("treeKeyAction", () => {
  const rows = rowsFor({ expanded: new Set(["a"]) });

  it("moves between rows", () => {
    expect(treeKeyAction(rows, "a", "ArrowDown", false)).toEqual({ type: "select", id: "b" });
    expect(treeKeyAction(rows, "b", "ArrowUp", false)).toEqual({ type: "select", id: "a" });
    expect(treeKeyAction(rows, "a", "ArrowUp", false)).toBeNull();
    expect(treeKeyAction(rows, "g", "ArrowDown", false)).toBeNull();
  });

  it("expands a closed parent, then moves into it", () => {
    expect(treeKeyAction(rows, "c", "ArrowRight", false)).toEqual({ type: "expand", id: "c" });
    expect(treeKeyAction(rows, "a", "ArrowRight", false)).toEqual({ type: "select", id: "b" });
    expect(treeKeyAction(rows, "b", "ArrowRight", false)).toBeNull();
  });

  it("collapses an open parent, else goes to the parent", () => {
    expect(treeKeyAction(rows, "a", "ArrowLeft", false)).toEqual({ type: "collapse", id: "a" });
    expect(treeKeyAction(rows, "b", "ArrowLeft", false)).toEqual({ type: "select", id: "a" });
    expect(treeKeyAction(rows, "g", "ArrowLeft", false)).toBeNull();
  });

  it("ignores left and right while searching", () => {
    expect(treeKeyAction(rows, "a", "ArrowLeft", true)).toBeNull();
    expect(treeKeyAction(rows, "c", "ArrowRight", true)).toBeNull();
  });
});

describe("countDescendants and moveTargets", () => {
  it("counts everything below an item", () => {
    expect(countDescendants(children, "a")).toBe(5);
    expect(countDescendants(children, "g")).toBe(0);
  });

  it("lists non-archived targets without the excluded branch", () => {
    expect(moveTargets(children, "c").map((t) => [t.node.id, t.depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["g", 0],
    ]);
    expect(moveTargets(children, "g").map((t) => t.node.id)).toEqual(["a", "b", "c", "d"]);
  });
});
