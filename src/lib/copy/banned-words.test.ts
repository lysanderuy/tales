import { describe, expect, it } from "vitest";

import { findBannedWords } from "./banned-words";

describe("findBannedWords", () => {
  it("returns an empty list for clean text", () => {
    expect(findBannedWords("Saved. Take your time.")).toEqual([]);
  });

  it("matches case-insensitively", () => {
    expect(findBannedWords("Your STREAK and Overdue items")).toEqual(["streak", "overdue"]);
  });

  it("matches whole words only", () => {
    expect(findBannedWords("translate the template, delete the nodes")).toEqual(["nodes"]);
    expect(findBannedWords("blockchain, goalkeeper, pacemaker")).toEqual([]);
  });

  it("matches words next to punctuation", () => {
    expect(findBannedWords("Failed, unfinished.")).toEqual(["failed", "unfinished"]);
  });

  it("deduplicates repeated hits", () => {
    expect(findBannedWords("goal goal Goal")).toEqual(["goal"]);
  });
});
