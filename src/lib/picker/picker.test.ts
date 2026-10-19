import { describe, expect, it } from "vitest";

import {
  buildHomeGroups,
  buildSearchGroups,
  isPicked,
  plannedTag,
  topicRows,
  type PickerTreeNode,
} from "./picker";

const node = (
  id: string,
  parentId: string | null,
  position: number,
  path: string[],
  extra: Partial<PickerTreeNode> = {},
): PickerTreeNode => ({
  id,
  parentId,
  name: path[path.length - 1],
  position,
  colorIndex: 2,
  path,
  effectivelyArchived: false,
  ...extra,
});

const nodes: PickerTreeNode[] = [
  node("anat", null, 1, ["Anatomy"]),
  node("heme", null, 0, ["Hematology"]),
  node("grp", "heme", 1, ["Hematology", "Blood grouping"]),
  node("anemia", "heme", 0, ["Hematology", "Anemia"]),
  node("iron", "anemia", 0, ["Hematology", "Anemia", "Iron"]),
  node("old", null, 2, ["Old"], { effectivelyArchived: true }),
  node("oldkid", "old", 0, ["Old", "Kid"], { effectivelyArchived: true }),
];

const planned = (blockId: string, nodeId: string, date: string) => ({
  blockId,
  nodeId,
  date,
  plannedMinutes: 60,
  progressSeconds: 2100,
});

describe("plannedTag", () => {
  it("tags yesterday and older days, leaves today untagged", () => {
    expect(plannedTag("2026-10-20", "2026-10-20")).toBeNull();
    expect(plannedTag("2026-10-19", "2026-10-20")).toBe("Yesterday");
    expect(plannedTag("2026-10-16", "2026-10-20")).toBe("Fri Oct 16");
    expect(plannedTag("2026-10-16", undefined)).toBeNull();
  });
});

describe("buildHomeGroups", () => {
  it("keeps planned order, drops archived, and excludes recents already planned", () => {
    const groups = buildHomeGroups(
      {
        planned: [
          planned("b1", "grp", "2026-10-20"),
          planned("b2", "old", "2026-10-20"),
          planned("b3", "anemia", "2026-10-19"),
        ],
        recent: [
          { id: "grp", path: ["Hematology", "Blood grouping"], colorIndex: 2 },
          { id: "oldkid", path: ["Old", "Kid"], colorIndex: 2 },
          { id: "iron", path: ["Hematology", "Anemia", "Iron"], colorIndex: 2 },
          { id: "anat", path: ["Anatomy"], colorIndex: 2 },
        ],
      },
      nodes,
      "2026-10-20",
    );

    expect(groups.planned.map((r) => r.blockId)).toEqual(["b1", "b3"]);
    expect(groups.planned[0].right).toBe("35 of 60 min");
    expect(groups.planned[1].sub).toBe("Yesterday · Hematology");
    expect(groups.recent.map((r) => r.nodeId)).toEqual(["iron", "anat"]);
    expect(groups.recent[0].sub).toBe("Hematology › Anemia");
    expect(groups.recent[1].sub).toBeNull();
  });

  it("limits recents to three", () => {
    const recent = ["anat", "heme", "grp", "anemia"].map((id) => ({
      id,
      path: [id],
      colorIndex: 0,
    }));
    expect(buildHomeGroups({ planned: [], recent }, nodes, undefined).recent).toHaveLength(3);
  });

  it("lists only active top-level Subjects in position order", () => {
    const groups = buildHomeGroups({ planned: [], recent: [] }, nodes, undefined);
    expect(groups.subjects.map((r) => r.nodeId)).toEqual(["heme", "anat"]);
    expect(groups.subjects.every((r) => r.expandable)).toBe(true);
    expect(groups.subjects[0].color).toBe("var(--c-3)");
  });
});

describe("buildSearchGroups", () => {
  it("returns planned and flat results without archived items", () => {
    const groups = buildSearchGroups(
      {
        planned: [planned("b1", "grp", "2026-10-20")],
        nodes: [
          { id: "grp", path: ["Hematology", "Blood grouping"], colorIndex: 2 },
          { id: "oldkid", path: ["Old", "Kid"], colorIndex: 2 },
        ],
      },
      nodes,
      "2026-10-20",
    );
    expect(groups.planned).toHaveLength(1);
    expect(groups.results.map((r) => r.nodeId)).toEqual(["grp"]);
    expect(groups.results[0].sub).toBe("Hematology");
  });
});

describe("topicRows", () => {
  it("flattens descendants depth-first with depth and parent flags", () => {
    expect(topicRows(nodes, "heme")).toEqual([
      { nodeId: "anemia", name: "Anemia", depth: 0, isParent: true },
      { nodeId: "iron", name: "Iron", depth: 1, isParent: false },
      { nodeId: "grp", name: "Blood grouping", depth: 0, isParent: false },
    ]);
  });

  it("omits archived Topics", () => {
    expect(topicRows(nodes, "old")).toEqual([]);
  });
});

describe("isPicked", () => {
  it("matches planned rows by block and others by node with no block", () => {
    expect(isPicked({ nodeId: "a", blockId: "b1" }, { nodeId: "a", blockId: "b1" })).toBe(true);
    expect(isPicked({ nodeId: "a", blockId: "b2" }, { nodeId: "a", blockId: "b1" })).toBe(false);
    expect(isPicked({ nodeId: "a", blockId: null }, { nodeId: "a", blockId: null })).toBe(true);
    expect(isPicked({ nodeId: "a", blockId: null }, { nodeId: "a", blockId: "b1" })).toBe(false);
  });
});
