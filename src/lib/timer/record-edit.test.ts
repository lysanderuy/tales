import { describe, expect, it } from "vitest";

import { buildRecordPatch, isEmptyPatch, recordEdits, type EditableRecord } from "./record-edit";

const MANILA = "Asia/Manila";

const record: EditableRecord = {
  nodeId: "n1",
  blockId: null,
  methodTag: null,
  note: null,
  startedAt: "2026-03-10T05:00:00.000Z",
  endedAt: "2026-03-10T05:40:00.000Z",
};

function patchOf(edits: Partial<ReturnType<typeof recordEdits>>, source = record, zone = MANILA) {
  return buildRecordPatch(source, { ...recordEdits(source, zone), ...edits }, zone);
}

describe("recordEdits", () => {
  it("shows the times in the given zone", () => {
    const edits = recordEdits(record, MANILA);
    expect(edits.start).toBe("13:00");
    expect(edits.end).toBe("13:40");
    expect(edits.note).toBe("");
  });
});

describe("buildRecordPatch", () => {
  it("returns an empty patch when nothing changed", () => {
    const result = patchOf({});
    expect(result).toEqual({ ok: true, patch: {} });
    expect(result.ok && isEmptyPatch(result.patch)).toBe(true);
  });

  it("sends only the changed time as an ISO instant in her zone", () => {
    expect(patchOf({ end: "13:55" })).toEqual({
      ok: true,
      patch: { endedAt: "2026-03-10T05:55:00.000Z" },
    });
  });

  it("uses the local day when it differs from the UTC day", () => {
    const late = {
      ...record,
      startedAt: "2026-03-10T17:30:00.000Z",
      endedAt: "2026-03-10T18:10:00.000Z",
    };
    expect(recordEdits(late, MANILA).start).toBe("01:30");
    expect(patchOf({ start: "00:45" }, late)).toEqual({
      ok: true,
      patch: { startedAt: "2026-03-10T16:45:00.000Z" },
    });
  });

  it("uses the end's own local day when start and end fall on different days", () => {
    const overnight = {
      ...record,
      startedAt: "2026-03-10T15:30:00.000Z",
      endedAt: "2026-03-10T16:30:00.000Z",
    };
    expect(recordEdits(overnight, MANILA)).toMatchObject({ start: "23:30", end: "00:30" });
    expect(patchOf({ end: "01:00" }, overnight)).toEqual({
      ok: true,
      patch: { endedAt: "2026-03-10T17:00:00.000Z" },
    });
    expect(patchOf({ start: "23:45" }, overnight)).toEqual({
      ok: true,
      patch: { startedAt: "2026-03-10T15:45:00.000Z" },
    });
  });

  it("works in a zone behind UTC", () => {
    const zone = "America/New_York";
    expect(recordEdits(record, zone).start).toBe("01:00");
    expect(patchOf({ start: "00:30" }, record, zone)).toEqual({
      ok: true,
      patch: { startedAt: "2026-03-10T04:30:00.000Z" },
    });
  });

  it("rejects an end that is not after the start", () => {
    expect(patchOf({ start: "14:00" })).toEqual({ ok: false, error: "endBeforeStart" });
    expect(patchOf({ end: "13:00" })).toEqual({ ok: false, error: "endBeforeStart" });
  });

  it("rejects an empty time", () => {
    expect(patchOf({ start: "" })).toEqual({ ok: false, error: "timeRequired" });
  });

  it("sends blockId only when a planned row is picked", () => {
    expect(patchOf({ nodeId: "n2", blockId: "b1" })).toEqual({
      ok: true,
      patch: { blockId: "b1" },
    });
  });

  it("sends nodeId only when the Subject changed", () => {
    expect(patchOf({ nodeId: "n2" })).toEqual({ ok: true, patch: { nodeId: "n2" } });
  });

  it("sends null when the note is cleared and ignores an unchanged blank note", () => {
    const noted = { ...record, note: "hello" };
    expect(patchOf({ note: "  " }, noted)).toEqual({ ok: true, patch: { note: null } });
    expect(patchOf({ note: "" })).toEqual({ ok: true, patch: {} });
  });

  it("sends a changed method, including clearing it", () => {
    expect(patchOf({ methodTag: "flashcards" })).toEqual({
      ok: true,
      patch: { methodTag: "flashcards" },
    });
    const tagged = { ...record, methodTag: "questions" as const };
    expect(patchOf({ methodTag: null }, tagged)).toEqual({ ok: true, patch: { methodTag: null } });
  });
});
