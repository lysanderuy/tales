import { describe, expect, it } from "vitest";

import { coverIdsOf, removeCover, replaceCover, setMark } from "./coverage";

describe("replaceCover", () => {
  it("fills an empty row", () => {
    const next = replaceCover({ covers: [null], marks: {} }, 0, "a");
    expect(next.covers).toEqual(["a"]);
  });

  it("carries the mark over to the new node", () => {
    const next = replaceCover({ covers: ["a"], marks: { a: "confident" } }, 0, "b");
    expect(next).toEqual({ covers: ["b"], marks: { b: "confident" } });
  });

  it("ignores a node already covered in another row", () => {
    const draft = { covers: ["a", null], marks: {} };
    expect(replaceCover(draft, 1, "a")).toBe(draft);
  });
});

describe("removeCover", () => {
  it("drops the row and its mark", () => {
    const next = removeCover(
      { covers: ["a", "b"], marks: { a: "review_again", b: "confident" } },
      0,
    );
    expect(next).toEqual({ covers: ["b"], marks: { b: "confident" } });
  });
});

describe("setMark", () => {
  it("sets and clears", () => {
    const set = setMark({ covers: ["a"], marks: {} }, "a", "confident");
    expect(set.marks).toEqual({ a: "confident" });
    expect(setMark(set, "a", null).marks).toEqual({});
  });
});

describe("coverIdsOf", () => {
  it("drops empty rows and duplicates", () => {
    expect(coverIdsOf(["a", null, "b", "a"])).toEqual(["a", "b"]);
  });
});
