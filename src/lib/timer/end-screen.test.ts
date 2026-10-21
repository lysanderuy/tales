import { describe, expect, it } from "vitest";

import { buildEndScreenUpdate, editsFromRecord } from "./end-screen";

const record = { nodeId: "n1", blockId: null, methodTag: null, note: null } as const;

describe("buildEndScreenUpdate", () => {
  it("sends only method and note when the Subject is unchanged", () => {
    const edits = { ...editsFromRecord(record), methodTag: "flashcards" as const, note: "x" };
    expect(buildEndScreenUpdate(record, edits)).toEqual({ methodTag: "flashcards", note: "x" });
  });

  it("sends nodeId for a newly picked Subject", () => {
    const edits = { ...editsFromRecord(record), nodeId: "n2" };
    expect(buildEndScreenUpdate(record, edits)).toEqual({
      nodeId: "n2",
      methodTag: null,
      note: null,
    });
  });

  it("sends blockId when a planned row was picked", () => {
    const edits = { ...editsFromRecord(record), nodeId: "n2", blockId: "b1" };
    expect(buildEndScreenUpdate(record, edits).blockId).toBe("b1");
    expect(buildEndScreenUpdate(record, edits).nodeId).toBeUndefined();
  });

  it("turns a blank note into null", () => {
    const edits = { ...editsFromRecord(record), note: "   " };
    expect(buildEndScreenUpdate(record, edits).note).toBeNull();
  });
});
