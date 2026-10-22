import { describe, expect, it } from "vitest";

import { applyMove } from "./optimistic";
import type { SubjectNode } from "./tree";

function node(
  id: string,
  parentId: string | null,
  position: number,
  colorIndex: number,
  path: string[],
  archived = false,
): SubjectNode {
  return {
    id,
    parentId,
    name: id,
    position,
    examWeight: null,
    archived,
    effectivelyArchived: archived,
    colorIndex,
    path,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const nodes = [
  node("A", null, 0, 0, ["A"]),
  node("B", "A", 0, 0, ["A", "B"]),
  node("C", "A", 1, 0, ["A", "C"]),
  node("D", "C", 0, 0, ["A", "C", "D"]),
  node("E", null, 1, 3, ["E"]),
  node("X", "E", 0, 3, ["E", "X"], true),
];

function get(list: SubjectNode[], id: string) {
  const found = list.find((n) => n.id === id);
  if (!found) throw new Error(id);
  return found;
}

describe("applyMove", () => {
  it("renumbers old and new siblings and rewrites the subtree", () => {
    const next = applyMove(nodes, "C", "E", 0);
    expect(get(next, "C")).toMatchObject({ parentId: "E", position: 0, colorIndex: 3 });
    expect(get(next, "C").path).toEqual(["E", "C"]);
    expect(get(next, "D").path).toEqual(["E", "C", "D"]);
    expect(get(next, "D").colorIndex).toBe(3);
    expect(get(next, "X").position).toBe(1);
    expect(get(next, "B").position).toBe(0);
  });

  it("accounts for the item's own removal within the same parent", () => {
    const next = applyMove(nodes, "B", "A", 1);
    expect(get(next, "C").position).toBe(0);
    expect(get(next, "B").position).toBe(1);
  });

  it("appends when no position is given", () => {
    expect(get(applyMove(nodes, "B", "E"), "B").position).toBe(1);
  });

  it("gives a promoted Topic the next free root color", () => {
    const next = applyMove(nodes, "C", null, 1);
    expect(get(next, "C")).toMatchObject({ parentId: null, position: 1, colorIndex: 1 });
    expect(get(next, "D").colorIndex).toBe(1);
    expect(get(next, "D").path).toEqual(["C", "D"]);
    expect(get(next, "E").position).toBe(2);
  });

  it("marks the subtree archived when moved under an archived parent", () => {
    const next = applyMove(nodes, "C", "X");
    expect(get(next, "C").effectivelyArchived).toBe(true);
    expect(get(next, "D").effectivelyArchived).toBe(true);
  });

  it("ignores moves into the item's own subtree", () => {
    expect(applyMove(nodes, "C", "D")).toEqual(nodes);
  });
});
