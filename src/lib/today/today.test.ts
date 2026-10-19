import { describe, expect, it } from "vitest";

import { assembleToday, pickNextUp, type TodayBlock, type TodayRecord } from "./today";

const block = (id: string, plannedMinutes: number | null = 60): TodayBlock => ({
  id,
  nodeId: `node-${id}`,
  plannedMinutes,
});

const record = (id: string, hour: number, over: Partial<TodayRecord> = {}): TodayRecord => ({
  id,
  blockId: null,
  nodeId: "n",
  startedAt: new Date(Date.UTC(2026, 0, 15, hour)),
  startClock: `${String(hour).padStart(2, "0")}:00`,
  endClock: `${String(hour).padStart(2, "0")}:30`,
  seconds: 1800,
  live: false,
  ...over,
});

describe("assembleToday", () => {
  it("lists a live record once even when it also appears among stopped ones", () => {
    const rows = assembleToday({
      blocks: [],
      progressByBlockId: new Map(),
      records: [record("r1", 9, { live: false }), record("r1", 9, { endClock: null, live: true })],
    });
    expect(rows).toHaveLength(1);
  });

  it("keeps a live record that started before today as a free row", () => {
    const rows = assembleToday({
      blocks: [block("b1")],
      progressByBlockId: new Map(),
      records: [record("r1", 23, { blockId: "yesterday-block", endClock: null, live: true })],
    });
    expect(rows.map((row) => row.kind)).toEqual(["planned", "free"]);
    expect(rows[1]).toMatchObject({ recordId: "r1", live: true });
  });

  it("is empty with nothing planned or studied", () => {
    expect(assembleToday({ blocks: [], progressByBlockId: new Map(), records: [] })).toEqual([]);
  });

  it("lists planned rows first in plan order, then free rows newest first", () => {
    const rows = assembleToday({
      blocks: [block("b2"), block("b1")],
      progressByBlockId: new Map(),
      records: [record("f1", 8), record("f2", 13)],
    });
    expect(rows.map((row) => (row.kind === "planned" ? row.blockId : row.recordId))).toEqual([
      "b2",
      "b1",
      "f2",
      "f1",
    ]);
  });

  it("rolls every record of a block into one row with its times in order", () => {
    const rows = assembleToday({
      blocks: [block("b1", 45)],
      progressByBlockId: new Map([["b1", 3000]]),
      records: [record("r2", 14, { blockId: "b1" }), record("r1", 9, { blockId: "b1" })],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: "planned",
      progressSeconds: 3000,
      plannedMinutes: 45,
      times: [
        { startClock: "09:00", endClock: "09:30" },
        { startClock: "14:00", endClock: "14:30" },
      ],
      live: false,
    });
  });

  it("flags a planned row as live when its record is running", () => {
    const rows = assembleToday({
      blocks: [block("b1")],
      progressByBlockId: new Map(),
      records: [record("r1", 9, { blockId: "b1", live: true, endClock: null })],
    });
    expect(rows[0]).toMatchObject({ live: true, times: [{ startClock: "09:00", endClock: null }] });
  });

  it("shows a record on a block from another day as a free row only", () => {
    const rows = assembleToday({
      blocks: [block("today")],
      progressByBlockId: new Map(),
      records: [record("r1", 9, { blockId: "yesterday" })],
    });
    expect(rows.map((row) => row.kind)).toEqual(["planned", "free"]);
    expect(rows[0]).toMatchObject({ times: [], progressSeconds: 0 });
  });

  it("allows a live free start with no Subject", () => {
    const rows = assembleToday({
      blocks: [],
      progressByBlockId: new Map(),
      records: [record("r1", 9, { nodeId: null, live: true, endClock: null })],
    });
    expect(rows[0]).toMatchObject({ kind: "free", nodeId: null, live: true, pending: false });
  });

  it("marks a stopped record with no Subject as pending", () => {
    const rows = assembleToday({
      blocks: [],
      progressByBlockId: new Map(),
      records: [record("r1", 9, { nodeId: null })],
    });
    expect(rows[0]).toMatchObject({ kind: "free", pending: true });
  });
});

describe("pickNextUp", () => {
  const blocks = [block("a", 30), block("b", 60), block("c", null)];

  it("returns the first row in plan order with time left", () => {
    expect(pickNextUp(blocks, new Map())).toEqual({
      blockId: "a",
      nodeId: "node-a",
      minutesLeft: 30,
    });
  });

  it("skips the excluded row", () => {
    expect(pickNextUp(blocks, new Map(), "a")?.blockId).toBe("b");
  });

  it("skips rows whose planned time is used up", () => {
    expect(pickNextUp(blocks, new Map([["a", 1800]]))?.blockId).toBe("b");
  });

  it("rounds minutes left up", () => {
    expect(pickNextUp(blocks, new Map([["a", 1741]]))?.minutesLeft).toBe(1);
  });

  it("treats an open row as available only while it has no time", () => {
    const open = [block("c", null)];
    expect(pickNextUp(open, new Map())).toEqual({
      blockId: "c",
      nodeId: "node-c",
      minutesLeft: null,
    });
    expect(pickNextUp(open, new Map([["c", 5]]))).toBeNull();
  });

  it("returns null when nothing qualifies", () => {
    expect(pickNextUp([], new Map())).toBeNull();
    expect(pickNextUp([block("a", 30)], new Map(), "a")).toBeNull();
  });
});
