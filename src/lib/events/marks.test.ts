import { describe, expect, it } from "vitest";

import { diffMarks, marksToRecord } from "./marks";

const original = [
  { nodeId: "a", mark: "confident" as const },
  { nodeId: "b", mark: "review_again" as const },
];

describe("diffMarks", () => {
  it("is empty when nothing changed", () => {
    expect(diffMarks(original, marksToRecord(original))).toEqual([]);
  });

  it("sets new and changed marks", () => {
    const draft = {
      a: "review_again" as const,
      b: "review_again" as const,
      c: "confident" as const,
    };
    expect(diffMarks(original, draft)).toEqual([
      { nodeId: "a", mark: "review_again" },
      { nodeId: "c", mark: "confident" },
    ]);
  });

  it("clears removed marks with null", () => {
    expect(diffMarks(original, { a: "confident" })).toEqual([{ nodeId: "b", mark: null }]);
  });
});
