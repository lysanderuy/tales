import { describe, expect, it } from "vitest";

import {
  createBlockSchema,
  listBlocksQuerySchema,
  planSummaryQuerySchema,
  reorderBlocksSchema,
  startBlockSchema,
  updateBlockSchema,
} from "./block.validator";

const id = "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90";
const id2 = "6a8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d91";
const day = "2026-01-15";

describe("createBlockSchema", () => {
  it("needs only a node and a date", () => {
    expect(createBlockSchema.safeParse({ nodeId: id, date: day }).success).toBe(true);
  });
  it("accepts time, minutes and position", () => {
    const parsed = createBlockSchema.parse({
      nodeId: id,
      date: day,
      timeOfDay: "08:30",
      plannedMinutes: 720,
      position: 0,
    });
    expect(parsed.plannedMinutes).toBe(720);
  });
  it("allows null time and minutes", () => {
    expect(
      createBlockSchema.safeParse({ nodeId: id, date: day, timeOfDay: null, plannedMinutes: null })
        .success,
    ).toBe(true);
  });
  it.each([0, 721, 1.5])("rejects planned minutes %s", (plannedMinutes) => {
    expect(createBlockSchema.safeParse({ nodeId: id, date: day, plannedMinutes }).success).toBe(
      false,
    );
  });
  it.each(["8:30", "24:00", "12:60", "08:30:00"])("rejects time %s", (timeOfDay) => {
    expect(createBlockSchema.safeParse({ nodeId: id, date: day, timeOfDay }).success).toBe(false);
  });
  it.each(["2026-13-01", "2026-02-30", "15-01-2026"])("rejects date %s", (date) => {
    expect(createBlockSchema.safeParse({ nodeId: id, date }).success).toBe(false);
  });
  it("rejects a negative position", () => {
    expect(createBlockSchema.safeParse({ nodeId: id, date: day, position: -1 }).success).toBe(
      false,
    );
  });
});

describe("updateBlockSchema", () => {
  it("needs at least one field", () => {
    expect(updateBlockSchema.safeParse({}).success).toBe(false);
  });
  it("allows clearing time and minutes", () => {
    expect(updateBlockSchema.safeParse({ timeOfDay: null, plannedMinutes: null }).success).toBe(
      true,
    );
  });
  it("does not allow clearing the node", () => {
    expect(updateBlockSchema.safeParse({ nodeId: null }).success).toBe(false);
  });
});

describe("reorderBlocksSchema", () => {
  it("accepts a list and an empty list", () => {
    expect(reorderBlocksSchema.safeParse({ date: day, orderedIds: [id, id2] }).success).toBe(true);
    expect(reorderBlocksSchema.safeParse({ date: day, orderedIds: [] }).success).toBe(true);
  });
  it("rejects duplicates", () => {
    expect(reorderBlocksSchema.safeParse({ date: day, orderedIds: [id, id] }).success).toBe(false);
  });
});

describe("listBlocksQuerySchema", () => {
  it("accepts a date with the default limit", () => {
    expect(listBlocksQuerySchema.parse({ date: day }).limit).toBe(200);
  });
  it("accepts a range", () => {
    expect(listBlocksQuerySchema.safeParse({ from: "2026-01-12", to: "2026-01-18" }).success).toBe(
      true,
    );
  });
  it("needs a date or a full range", () => {
    expect(listBlocksQuerySchema.safeParse({}).success).toBe(false);
    expect(listBlocksQuerySchema.safeParse({ from: "2026-01-12" }).success).toBe(false);
  });
  it("rejects a date mixed with a range, or a backwards range", () => {
    expect(
      listBlocksQuerySchema.safeParse({ date: day, from: "2026-01-12", to: "2026-01-18" }).success,
    ).toBe(false);
    expect(listBlocksQuerySchema.safeParse({ from: "2026-01-18", to: "2026-01-12" }).success).toBe(
      false,
    );
  });
  it("caps the limit", () => {
    expect(listBlocksQuerySchema.safeParse({ date: day, limit: "501" }).success).toBe(false);
  });
});

describe("startBlockSchema", () => {
  it("defaults to planned", () => {
    expect(startBlockSchema.parse({})).toEqual({ startedFrom: "planned" });
  });
  it("accepts next_up and rejects free", () => {
    expect(startBlockSchema.parse({ startedFrom: "next_up" }).startedFrom).toBe("next_up");
    expect(startBlockSchema.safeParse({ startedFrom: "free" }).success).toBe(false);
  });
});

describe("planSummaryQuerySchema", () => {
  it("needs an ordered range", () => {
    expect(planSummaryQuerySchema.safeParse({ from: "2026-01-12", to: "2026-01-18" }).success).toBe(
      true,
    );
    expect(planSummaryQuerySchema.safeParse({ from: "2026-01-19", to: "2026-01-18" }).success).toBe(
      false,
    );
    expect(planSummaryQuerySchema.safeParse({ from: "2026-01-12" }).success).toBe(false);
  });
});
