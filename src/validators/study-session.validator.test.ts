import { describe, expect, it } from "vitest";

import {
  extendSessionSchema,
  listSessionsQuerySchema,
  manualSessionSchema,
  startSessionSchema,
  stopSessionSchema,
  updateSessionSchema,
} from "./study-session.validator";

const id = "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90";

describe("startSessionSchema", () => {
  it("accepts an empty body and defaults startedFrom", () => {
    expect(startSessionSchema.parse({})).toEqual({ startedFrom: "free" });
  });
  it("accepts a node and planned minutes in range", () => {
    expect(startSessionSchema.parse({ nodeId: id, plannedMinutes: 600 }).plannedMinutes).toBe(600);
  });
  it.each([0, 601, 1.5])("rejects planned minutes %s", (plannedMinutes) => {
    expect(startSessionSchema.safeParse({ plannedMinutes }).success).toBe(false);
  });
  it("rejects planned for now", () => {
    expect(startSessionSchema.safeParse({ startedFrom: "planned" }).success).toBe(false);
  });
});

describe("updateSessionSchema", () => {
  it("needs at least one field", () => {
    expect(updateSessionSchema.safeParse({}).success).toBe(false);
  });
  it("allows clearing method and note", () => {
    expect(updateSessionSchema.safeParse({ methodTag: null, note: null }).success).toBe(true);
  });
  it("does not allow clearing the node", () => {
    expect(updateSessionSchema.safeParse({ nodeId: null }).success).toBe(false);
  });
  it("limits note length", () => {
    expect(updateSessionSchema.safeParse({ note: "a".repeat(5000) }).success).toBe(true);
    expect(updateSessionSchema.safeParse({ note: "a".repeat(5001) }).success).toBe(false);
  });
  it("parses timestamps to dates", () => {
    const parsed = updateSessionSchema.parse({ startedAt: "2026-01-15T09:30:00Z" });
    expect(parsed.startedAt).toEqual(new Date("2026-01-15T09:30:00Z"));
  });
  it("rejects bad timestamps", () => {
    expect(updateSessionSchema.safeParse({ endedAt: "yesterday" }).success).toBe(false);
  });
});

describe("stopSessionSchema and extendSessionSchema", () => {
  it("stop allows an empty body", () => {
    expect(stopSessionSchema.parse({})).toEqual({});
  });
  it("extend needs minutes 1 to 600", () => {
    expect(extendSessionSchema.safeParse({ minutes: 25 }).success).toBe(true);
    expect(extendSessionSchema.safeParse({ minutes: 0 }).success).toBe(false);
    expect(extendSessionSchema.safeParse({}).success).toBe(false);
  });
});

describe("manualSessionSchema", () => {
  const base = { nodeId: id, startedAt: "2026-01-15T09:00:00Z", endedAt: "2026-01-15T10:00:00Z" };
  it("accepts start before end", () => {
    expect(manualSessionSchema.safeParse(base).success).toBe(true);
  });
  it("rejects end at or before start with the plain message", () => {
    const result = manualSessionSchema.safeParse({ ...base, endedAt: base.startedAt });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("End needs to be after the start.");
  });
  it("requires a node", () => {
    expect(manualSessionSchema.safeParse({ ...base, nodeId: undefined }).success).toBe(false);
  });
});

describe("listSessionsQuerySchema", () => {
  it("defaults the limit", () => {
    expect(listSessionsQuerySchema.parse({}).limit).toBe(200);
  });
  it("coerces and caps the limit", () => {
    expect(listSessionsQuerySchema.parse({ limit: "50" }).limit).toBe(50);
    expect(listSessionsQuerySchema.safeParse({ limit: "501" }).success).toBe(false);
  });
  it("validates the date key", () => {
    expect(listSessionsQuerySchema.safeParse({ date: "2026-01-15" }).success).toBe(true);
    expect(listSessionsQuerySchema.safeParse({ date: "2026-1-15" }).success).toBe(false);
  });
  it("does not mix date with from or to", () => {
    expect(
      listSessionsQuerySchema.safeParse({ date: "2026-01-15", from: "2026-01-15T00:00:00Z" })
        .success,
    ).toBe(false);
  });
});
