import { describe, expect, it } from "vitest";

import { DAILY_VERSE_SET_ID, resolveSelectedSetId } from "./selection";

describe("resolveSelectedSetId", () => {
  it("picks the first set with an explicit on row", () => {
    expect(resolveSelectedSetId(["a", "b", "c"], new Set(["b", "c"]))).toBe("b");
  });

  it("defaults to Daily Readings when nothing is on", () => {
    expect(resolveSelectedSetId(["a", DAILY_VERSE_SET_ID], new Set())).toBe(DAILY_VERSE_SET_ID);
  });

  it("ignores on rows for sets that are not readable", () => {
    expect(resolveSelectedSetId(["a", DAILY_VERSE_SET_ID], new Set(["gone"]))).toBe(
      DAILY_VERSE_SET_ID,
    );
  });

  it("falls back to the first set when Daily Readings is missing", () => {
    expect(resolveSelectedSetId(["a", "b"], new Set())).toBe("a");
  });

  it("returns undefined when there are no sets", () => {
    expect(resolveSelectedSetId([], new Set())).toBeUndefined();
  });
});
