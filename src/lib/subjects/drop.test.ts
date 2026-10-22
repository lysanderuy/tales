import { describe, expect, it } from "vitest";

import { dropIntent, kindFromFraction, moveArgsFor, type DropContext } from "./drop";
import { buildChildrenMap, buildNodeMap, visibleRows, type SubjectNode } from "./tree";

function node(
  id: string,
  parentId: string | null,
  position: number,
  archived = false,
  effectivelyArchived = archived,
): SubjectNode {
  return {
    id,
    parentId,
    name: id,
    position,
    examWeight: null,
    archived,
    effectivelyArchived,
    colorIndex: 0,
    path: [id],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const nodes = [
  node("A", null, 0),
  node("B", "A", 0),
  node("C", "A", 1),
  node("D", "A", 2),
  node("E", null, 1),
  node("F", null, 2, true),
  node("G", "C", 0),
];
const byId = buildNodeMap(nodes);
const children = buildChildrenMap(nodes);

function context(expanded: string[]): DropContext {
  return {
    byId,
    children,
    rows: visibleRows({
      children,
      byId,
      expanded: new Set(expanded),
      query: "",
      showArchived: true,
    }),
  };
}

describe("kindFromFraction", () => {
  it("splits a row into quarter, half, quarter", () => {
    expect(kindFromFraction(0.1)).toBe("before");
    expect(kindFromFraction(0.5)).toBe("inside");
    expect(kindFromFraction(0.9)).toBe("after");
  });
});

describe("moveArgsFor", () => {
  it("moves down within the same parent accounting for the removal", () => {
    expect(moveArgsFor({ byId, children }, "B", { kind: "after", targetId: "C" })).toEqual({
      parentId: "A",
      position: 1,
    });
    expect(moveArgsFor({ byId, children }, "B", { kind: "after", targetId: "D" })).toEqual({
      parentId: "A",
      position: 2,
    });
  });

  it("moves up within the same parent", () => {
    expect(moveArgsFor({ byId, children }, "D", { kind: "before", targetId: "B" })).toEqual({
      parentId: "A",
      position: 0,
    });
  });

  it("returns null for no-op drops", () => {
    expect(moveArgsFor({ byId, children }, "B", { kind: "before", targetId: "C" })).toBeNull();
    expect(moveArgsFor({ byId, children }, "C", { kind: "after", targetId: "B" })).toBeNull();
    expect(moveArgsFor({ byId, children }, "D", { kind: "inside", targetId: "A" })).toBeNull();
  });

  it("nests as the last child of the target", () => {
    expect(moveArgsFor({ byId, children }, "E", { kind: "inside", targetId: "A" })).toEqual({
      parentId: "A",
      position: 3,
    });
    expect(moveArgsFor({ byId, children }, "E", { kind: "inside", targetId: "B" })).toEqual({
      parentId: "B",
      position: 0,
    });
  });

  it("moves into another parent at a specific place", () => {
    expect(moveArgsFor({ byId, children }, "E", { kind: "before", targetId: "C" })).toEqual({
      parentId: "A",
      position: 1,
    });
  });

  it("makes a Topic a Subject when dropped beside a root", () => {
    expect(moveArgsFor({ byId, children }, "B", { kind: "after", targetId: "A" })).toEqual({
      parentId: null,
      position: 1,
    });
  });
});

describe("dropIntent", () => {
  const rows = context(["A"]);

  it("rejects self, own subtree and archived targets", () => {
    const deep = context(["A", "C"]);
    expect(dropIntent(deep, "C", "C", 0.5)).toBeNull();
    expect(dropIntent(deep, "C", "G", 0.5)).toBeNull();
    expect(dropIntent(rows, "E", "F", 0.5)).toBeNull();
    expect(dropIntent(rows, "F", "E", 0.5)).toBeNull();
  });

  it("reads the quarter and half zones", () => {
    expect(dropIntent(rows, "E", "C", 0.1)).toEqual({ kind: "before", targetId: "C" });
    expect(dropIntent(rows, "E", "C", 0.5)).toEqual({ kind: "inside", targetId: "C" });
    expect(dropIntent(rows, "E", "C", 0.9)).toEqual({ kind: "after", targetId: "C" });
  });

  it("treats the bottom of an open parent as before its first child", () => {
    expect(dropIntent(rows, "E", "A", 0.9)).toEqual({ kind: "before", targetId: "B" });
  });

  it("keeps the bottom of a closed parent as after it", () => {
    expect(dropIntent(context([]), "E", "A", 0.9)).toBeNull();
    expect(dropIntent(context([]), "B", "A", 0.9)).toEqual({ kind: "after", targetId: "A" });
  });

  it("rejects no-op drops", () => {
    expect(dropIntent(rows, "B", "C", 0.1)).toBeNull();
    expect(dropIntent(rows, "B", "A", 0.9)).toBeNull();
  });
});
