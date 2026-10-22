import { describe, expect, it } from "vitest";

import { messages } from "@/lib/messages";

import {
  createOutlineNodeSchema,
  listOutlineNodesQuerySchema,
  moveOutlineNodeSchema,
  reorderOutlineNodesSchema,
  updateOutlineNodeSchema,
} from "./outline-node.validator";

const id = "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90";
const id2 = "6f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d91";

describe("createOutlineNodeSchema", () => {
  it("accepts a name only and trims it", () => {
    const result = createOutlineNodeSchema.safeParse({ name: "  Hematology  " });
    expect(result.success && result.data.name).toBe("Hematology");
  });

  it("rejects empty and over-long names", () => {
    expect(createOutlineNodeSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createOutlineNodeSchema.safeParse({ name: "a".repeat(200) }).success).toBe(true);
    expect(createOutlineNodeSchema.safeParse({ name: "a".repeat(201) }).success).toBe(false);
  });

  it("rejects > with its own message", () => {
    const result = createOutlineNodeSchema.safeParse({ name: "A > B" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(messages.nodeNameInvalidChar);
  });

  it("validates parentId and exam weight", () => {
    expect(createOutlineNodeSchema.safeParse({ name: "A", parentId: "nope" }).success).toBe(false);
    expect(createOutlineNodeSchema.safeParse({ name: "A", parentId: id }).success).toBe(true);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: 0 }).success).toBe(true);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: 100 }).success).toBe(true);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: 12.5 }).success).toBe(true);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: 100.1 }).success).toBe(false);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: -1 }).success).toBe(false);
    expect(createOutlineNodeSchema.safeParse({ name: "A", examWeight: 12.55 }).success).toBe(false);
  });
});

describe("updateOutlineNodeSchema", () => {
  it("requires at least one field", () => {
    expect(updateOutlineNodeSchema.safeParse({}).success).toBe(false);
  });

  it("accepts rename, null weight and archive flag", () => {
    expect(updateOutlineNodeSchema.safeParse({ name: "New" }).success).toBe(true);
    expect(updateOutlineNodeSchema.safeParse({ examWeight: null }).success).toBe(true);
    expect(updateOutlineNodeSchema.safeParse({ archived: true }).success).toBe(true);
    expect(updateOutlineNodeSchema.safeParse({ name: "a>b" }).success).toBe(false);
  });
});

describe("moveOutlineNodeSchema", () => {
  it("accepts a null or uuid parent and optional position", () => {
    expect(moveOutlineNodeSchema.safeParse({ parentId: null }).success).toBe(true);
    expect(moveOutlineNodeSchema.safeParse({ parentId: id, position: 2 }).success).toBe(true);
  });

  it("requires parentId and a non-negative integer position", () => {
    expect(moveOutlineNodeSchema.safeParse({}).success).toBe(false);
    expect(moveOutlineNodeSchema.safeParse({ parentId: null, position: -1 }).success).toBe(false);
    expect(moveOutlineNodeSchema.safeParse({ parentId: null, position: 1.5 }).success).toBe(false);
  });
});

describe("reorderOutlineNodesSchema", () => {
  it("accepts unique uuids", () => {
    expect(
      reorderOutlineNodesSchema.safeParse({ parentId: null, orderedIds: [id, id2] }).success,
    ).toBe(true);
  });

  it("rejects empty, duplicate or malformed ids", () => {
    expect(reorderOutlineNodesSchema.safeParse({ parentId: null, orderedIds: [] }).success).toBe(
      false,
    );
    expect(
      reorderOutlineNodesSchema.safeParse({ parentId: null, orderedIds: [id, id] }).success,
    ).toBe(false);
    expect(reorderOutlineNodesSchema.safeParse({ parentId: null, orderedIds: ["x"] }).success).toBe(
      false,
    );
  });
});

describe("listOutlineNodesQuerySchema", () => {
  it("defaults includeArchived to false", () => {
    const empty = listOutlineNodesQuerySchema.parse({});
    expect(empty.includeArchived).toBe(false);
    expect(listOutlineNodesQuerySchema.parse({ includeArchived: "true" }).includeArchived).toBe(
      true,
    );
  });
});
