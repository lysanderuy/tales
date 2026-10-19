import { describe, expect, it } from "vitest";

import { chartScaleMinutes, segmentHeightPx } from "./chart";

describe("chartScaleMinutes", () => {
  it("never goes below 300 minutes", () => {
    expect(chartScaleMinutes([0, 3600])).toBe(300);
    expect(chartScaleMinutes([])).toBe(300);
  });

  it("grows to the largest day", () => {
    expect(chartScaleMinutes([0, 24000])).toBe(400);
  });
});

describe("segmentHeightPx", () => {
  it("scales over 140px with a 4px floor", () => {
    expect(segmentHeightPx(9000, 300)).toBe(70);
    expect(segmentHeightPx(60, 300)).toBe(4);
  });
});
