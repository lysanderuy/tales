import { describe, expect, it } from "vitest";

import { buildSubjectIndex, formatPath, resolveSubject } from "./subject-index";

const nodes = [
  { id: "a", parentId: null, name: "ISBB", colorIndex: 0 },
  { id: "b", parentId: "a", name: "Blood Banking", colorIndex: 0 },
  { id: "c", parentId: "b", name: "Blood grouping", colorIndex: 0 },
  { id: "d", parentId: null, name: "Clinical Microscopy", colorIndex: 1 },
];

describe("buildSubjectIndex", () => {
  const index = buildSubjectIndex(nodes);

  it("resolves root, ancestors and color", () => {
    expect(index.get("c")).toEqual({
      id: "c",
      name: "Blood grouping",
      ancestors: ["ISBB", "Blood Banking"],
      rootId: "a",
      color: "var(--c-1)",
    });
  });

  it("gives a Subject no ancestors and its own color", () => {
    expect(index.get("d")).toMatchObject({ ancestors: [], rootId: "d", color: "var(--c-2)" });
  });

  it("does not loop on a cycle", () => {
    const cyclic = buildSubjectIndex([
      { id: "x", parentId: "y", name: "X", colorIndex: 2 },
      { id: "y", parentId: "x", name: "Y", colorIndex: 2 },
    ]);
    expect(cyclic.get("x")?.ancestors).toEqual(["Y"]);
  });
});

describe("formatPath", () => {
  it("joins with a single angle", () => {
    expect(formatPath(["ISBB", "Blood Banking"])).toBe("ISBB › Blood Banking");
    expect(formatPath([])).toBe("");
  });
});

describe("resolveSubject", () => {
  it("falls back to a neutral entry for an unknown id", () => {
    const index = buildSubjectIndex(nodes);
    expect(resolveSubject(index, "a", "Other").name).toBe("ISBB");
    expect(resolveSubject(index, "zzz", "Other")).toMatchObject({
      name: "Other",
      color: "var(--border)",
    });
  });
});
