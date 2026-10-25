import { describe, expect, it } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("uses the first and last word", () => {
    expect(initials("Maria Santos")).toBe("MS");
    expect(initials("  maria  de la  cruz ")).toBe("MC");
  });

  it("uses one letter for a single word", () => {
    expect(initials("maria")).toBe("M");
  });

  it("falls back to a question mark when empty", () => {
    expect(initials("   ")).toBe("?");
  });
});
