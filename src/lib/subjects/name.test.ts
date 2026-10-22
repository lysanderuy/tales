import { describe, expect, it } from "vitest";

import { parseWeight, validateName } from "./name";

describe("validateName", () => {
  it("rejects empty, > and duplicate names", () => {
    expect(validateName("  ", [])).toBe("empty");
    expect(validateName("A > B", [])).toBe("invalidChar");
    expect(validateName(" urine ", ["Urine"])).toBe("taken");
    expect(validateName("Feces", ["Urine"])).toBeNull();
  });
});

describe("parseWeight", () => {
  it("treats empty as clearing the weight", () => {
    expect(parseWeight(" ")).toEqual({ ok: true, value: null });
  });

  it("rounds to one decimal", () => {
    expect(parseWeight("12.34")).toEqual({ ok: true, value: 12.3 });
    expect(parseWeight("100")).toEqual({ ok: true, value: 100 });
    expect(parseWeight("0")).toEqual({ ok: true, value: 0 });
  });

  it("rejects values outside 0 to 100 or not numbers", () => {
    expect(parseWeight("-1")).toEqual({ ok: false });
    expect(parseWeight("100.5")).toEqual({ ok: false });
    expect(parseWeight("abc")).toEqual({ ok: false });
  });
});
