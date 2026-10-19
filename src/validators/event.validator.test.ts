import { describe, expect, it } from "vitest";

import {
  closeEventSchema,
  createEventSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from "./event.validator";

const id = "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90";
const id2 = "6a8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d91";

describe("createEventSchema", () => {
  const base = { title: "Preboard 1", type: "preboard", date: "2026-03-02" };

  it("needs only title, type and date", () => {
    expect(createEventSchema.safeParse(base).success).toBe(true);
  });
  it("accepts time, covers and note", () => {
    expect(
      createEventSchema.safeParse({ ...base, time: "09:30", coverIds: [id, id2], note: "x" })
        .success,
    ).toBe(true);
  });
  it("rejects a blank or long title", () => {
    expect(createEventSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, title: "a".repeat(101) }).success).toBe(false);
  });
  it("rejects an unknown type, bad date or bad time", () => {
    expect(createEventSchema.safeParse({ ...base, type: "quiz" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, date: "2026-02-30" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, time: "9:30" }).success).toBe(false);
  });
  it("rejects duplicate covers and long notes", () => {
    expect(createEventSchema.safeParse({ ...base, coverIds: [id, id] }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...base, note: "a".repeat(5001) }).success).toBe(false);
  });
});

describe("updateEventSchema", () => {
  it("needs at least one field", () => {
    expect(updateEventSchema.safeParse({}).success).toBe(false);
    expect(updateEventSchema.safeParse({ coverIds: [] }).success).toBe(true);
  });
  it("allows clearing time and note", () => {
    expect(updateEventSchema.safeParse({ time: null, note: null }).success).toBe(true);
  });
});

describe("closeEventSchema", () => {
  it("allows an empty close", () => {
    expect(closeEventSchema.safeParse({}).success).toBe(true);
  });
  it("accepts marks and null to clear", () => {
    const parsed = closeEventSchema.parse({
      note: "ok",
      marks: [
        { nodeId: id, mark: "confident" },
        { nodeId: id2, mark: null },
      ],
    });
    expect(parsed.marks).toHaveLength(2);
  });
  it("rejects unknown marks and repeated items", () => {
    expect(closeEventSchema.safeParse({ marks: [{ nodeId: id, mark: "done" }] }).success).toBe(
      false,
    );
    expect(
      closeEventSchema.safeParse({
        marks: [
          { nodeId: id, mark: "confident" },
          { nodeId: id, mark: null },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("listEventsQuerySchema", () => {
  it("allows no range or a partial one", () => {
    expect(listEventsQuerySchema.safeParse({}).success).toBe(true);
    expect(listEventsQuerySchema.safeParse({ from: "2026-03-01" }).success).toBe(true);
  });
  it("rejects a reversed range", () => {
    expect(listEventsQuerySchema.safeParse({ from: "2026-03-02", to: "2026-03-01" }).success).toBe(
      false,
    );
  });
});
