import { describe, expect, it } from "vitest";

import { chooseLine, parsePasteLines } from "./pick";

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("chooseLine", () => {
  it("returns null when nothing is visible", () => {
    expect(chooseLine({ visibleLineIds: [], pickHistory: ["a"], random: () => 0.5 })).toBeNull();
  });

  it("returns the only line every time", () => {
    expect(chooseLine({ visibleLineIds: ["a"], pickHistory: [], random: () => 0.9 })).toBe("a");
    expect(chooseLine({ visibleLineIds: ["a"], pickHistory: ["a", "a"], random: () => 0.1 })).toBe(
      "a",
    );
  });

  it("shows every line once before repeating, then restarts", () => {
    const visible = ["a", "b", "c", "d"];
    const random = seeded(7);
    const history: string[] = [];
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const seen = new Set<string>();
      for (let i = 0; i < visible.length; i += 1) {
        const id = chooseLine({ visibleLineIds: visible, pickHistory: history, random });
        expect(id).not.toBeNull();
        expect(seen.has(id as string)).toBe(false);
        seen.add(id as string);
        history.push(id as string);
      }
      expect(seen.size).toBe(visible.length);
    }
  });

  it("lets a newly visible line enter the current cycle", () => {
    const id = chooseLine({
      visibleLineIds: ["a", "b", "c"],
      pickHistory: ["a", "b"],
      random: () => 0,
    });
    expect(id).toBe("c");
  });

  it("ignores hidden or deleted lines in the history", () => {
    const id = chooseLine({
      visibleLineIds: ["a", "b"],
      pickHistory: ["x", "a", "y"],
      random: () => 0,
    });
    expect(id).toBe("b");
  });

  it("starts a fresh cycle once the visible lines are all in the history", () => {
    const id = chooseLine({
      visibleLineIds: ["a", "b"],
      pickHistory: ["a", "b"],
      random: () => 0.99,
    });
    expect(["a", "b"]).toContain(id);
  });

  it("never reads past the candidates when random returns 1", () => {
    expect(chooseLine({ visibleLineIds: ["a", "b"], pickHistory: [], random: () => 1 })).toBe("b");
  });
});

describe("parsePasteLines", () => {
  it("trims rows and drops empty ones", () => {
    expect(parsePasteLines("  one \n\n   \ntwo\r\nthree", [])).toEqual({
      lines: ["one", "two", "three"],
      skippedEmpty: 2,
      skippedDuplicate: 0,
      tooLong: 0,
    });
  });

  it("drops duplicates within the paste and already in the set", () => {
    expect(parsePasteLines("a\nb\na\nc\nb", ["c"])).toEqual({
      lines: ["a", "b"],
      skippedEmpty: 0,
      skippedDuplicate: 3,
      tooLong: 0,
    });
  });

  it("counts over-long rows instead of adding them", () => {
    const long = "x".repeat(501);
    const ok = "y".repeat(500);
    expect(parsePasteLines(`${long}\n${ok}`, [])).toEqual({
      lines: [ok],
      skippedEmpty: 0,
      skippedDuplicate: 0,
      tooLong: 1,
    });
  });

  it("does not count a trailing newline as an empty row", () => {
    expect(parsePasteLines("a\nb\n", []).skippedEmpty).toBe(0);
    expect(parsePasteLines("", [])).toEqual({
      lines: [],
      skippedEmpty: 0,
      skippedDuplicate: 0,
      tooLong: 0,
    });
  });
});
