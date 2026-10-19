import { describe, expect, it } from "vitest";

import { placeFloating, placeSide } from "./position";

const viewport = { width: 1200, height: 800 };

describe("placeFloating", () => {
  it("centers under the anchor", () => {
    const anchor = { left: 500, top: 20, bottom: 60, width: 100 };
    expect(placeFloating(anchor, 320, 470, viewport)).toEqual({ left: 390, top: 68, bottom: null });
  });

  it("clamps horizontally to 8px from the edges", () => {
    const left = { left: 0, top: 20, bottom: 60, width: 40 };
    const right = { left: 1180, top: 20, bottom: 60, width: 20 };
    expect(placeFloating(left, 320, 470, viewport).left).toBe(8);
    expect(placeFloating(right, 320, 470, viewport).left).toBe(872);
  });

  it("flips above when there is no room below", () => {
    const anchor = { left: 500, top: 700, bottom: 740, width: 100 };
    expect(placeFloating(anchor, 320, 470, viewport)).toEqual({
      left: 390,
      top: null,
      bottom: 108,
    });
  });

  it("pins inside the viewport when neither side has room", () => {
    const anchor = { left: 500, top: 200, bottom: 240, width: 100 };
    const short = { width: 1200, height: 500 };
    expect(placeFloating(anchor, 320, 470, short)).toEqual({ left: 390, top: 22, bottom: null });
  });
});

describe("placeSide", () => {
  it("opens to the right when it fits", () => {
    expect(placeSide(100, 320, 280, viewport)).toEqual({ left: 428, fits: true });
  });

  it("flips to the left when the right is full", () => {
    expect(placeSide(880, 320, 280, viewport)).toEqual({ left: 592, fits: true });
  });

  it("reports no fit on narrow windows", () => {
    expect(placeSide(8, 320, 280, { width: 420, height: 800 }).fits).toBe(false);
  });
});
