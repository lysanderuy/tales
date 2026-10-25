import { describe, expect, it } from "vitest";

import { decideCommit } from "./commit";

describe("decideCommit", () => {
  it("skips an unchanged draft", () => {
    expect(decideCommit({ draft: "Ana", value: "Ana", required: true })).toEqual({ kind: "skip" });
  });

  it("skips a draft that only differs by whitespace", () => {
    expect(decideCommit({ draft: "  Ana ", value: "Ana", required: false })).toEqual({
      kind: "skip",
    });
  });

  it("reverts a blank required field", () => {
    expect(decideCommit({ draft: "   ", value: "Ana", required: true })).toEqual({
      kind: "revert-required",
    });
  });

  it("saves an emptied optional field", () => {
    expect(decideCommit({ draft: " ", value: "Ana", required: false })).toEqual({
      kind: "save",
      value: "",
    });
  });

  it("saves a changed draft trimmed", () => {
    expect(decideCommit({ draft: " Bea ", value: "Ana", required: true })).toEqual({
      kind: "save",
      value: "Bea",
    });
  });
});
