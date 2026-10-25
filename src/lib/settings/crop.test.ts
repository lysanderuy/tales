import { describe, expect, it } from "vitest";

import {
  exceedsPixelCap,
  fitContain,
  initialCrop,
  moveCrop,
  resizeCrop,
  toSourceRect,
  zoomCrop,
  type Rect,
} from "./crop";

const bounds: Rect = { x: 0, y: 40, width: 200, height: 120 };
const crop: Rect = { x: 50, y: 60, width: 80, height: 80 };

describe("exceedsPixelCap", () => {
  it("allows images at the cap", () => {
    expect(exceedsPixelCap({ width: 8000, height: 5000 })).toBe(false);
  });

  it("rejects images over the cap", () => {
    expect(exceedsPixelCap({ width: 8001, height: 5000 })).toBe(true);
    expect(exceedsPixelCap({ width: 20000, height: 20000 })).toBe(true);
  });
});

describe("fitContain", () => {
  it("centers a wide image", () => {
    expect(fitContain({ width: 400, height: 200 }, { width: 300, height: 300 })).toEqual({
      x: 0,
      y: 75,
      width: 300,
      height: 150,
    });
  });

  it("centers a tall image", () => {
    expect(fitContain({ width: 100, height: 400 }, { width: 300, height: 300 })).toEqual({
      x: 112.5,
      y: 0,
      width: 75,
      height: 300,
    });
  });

  it("scales a tiny image up to the stage", () => {
    expect(fitContain({ width: 10, height: 10 }, { width: 300, height: 300 })).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 300,
    });
  });
});

describe("initialCrop", () => {
  it("is a centered square at 80% of the shorter side", () => {
    expect(initialCrop(bounds)).toEqual({ x: 52, y: 52, width: 96, height: 96 });
  });
});

describe("moveCrop", () => {
  it("moves freely inside the bounds", () => {
    expect(moveCrop(crop, 10, 5, bounds)).toEqual({ ...crop, x: 60, y: 65 });
  });

  it("clamps at each edge", () => {
    expect(moveCrop(crop, -500, 0, bounds).x).toBe(0);
    expect(moveCrop(crop, 500, 0, bounds).x).toBe(120);
    expect(moveCrop(crop, 0, -500, bounds).y).toBe(40);
    expect(moveCrop(crop, 0, 500, bounds).y).toBe(80);
  });
});

describe("resizeCrop", () => {
  it("grows from the se corner, anchored at nw", () => {
    expect(resizeCrop(crop, "se", 10, 10, bounds, 20)).toEqual({
      x: 50,
      y: 60,
      width: 90,
      height: 90,
    });
  });

  it("grows from the nw corner, anchored at se", () => {
    expect(resizeCrop(crop, "nw", -10, -10, bounds, 20)).toEqual({
      x: 40,
      y: 50,
      width: 90,
      height: 90,
    });
  });

  it("grows from the ne corner, anchored at sw", () => {
    expect(resizeCrop(crop, "ne", 10, -10, bounds, 20)).toEqual({
      x: 50,
      y: 50,
      width: 90,
      height: 90,
    });
  });

  it("grows from the sw corner, anchored at ne", () => {
    expect(resizeCrop(crop, "sw", -10, 10, bounds, 20)).toEqual({
      x: 40,
      y: 60,
      width: 90,
      height: 90,
    });
  });

  it("shrinks and stops at the minimum size", () => {
    expect(resizeCrop(crop, "se", -500, -500, bounds, 20)).toEqual({
      x: 50,
      y: 60,
      width: 20,
      height: 20,
    });
    expect(resizeCrop(crop, "nw", 500, 500, bounds, 20)).toEqual({
      x: 110,
      y: 120,
      width: 20,
      height: 20,
    });
  });

  it("stops at the nearest image edge", () => {
    expect(resizeCrop(crop, "se", 500, 500, bounds, 20)).toEqual({
      x: 50,
      y: 60,
      width: 100,
      height: 100,
    });
    expect(resizeCrop(crop, "nw", -500, -500, bounds, 20)).toEqual({
      x: 30,
      y: 40,
      width: 100,
      height: 100,
    });
  });

  it("follows the larger axis of an uneven drag", () => {
    expect(resizeCrop(crop, "se", 20, 5, bounds, 20).width).toBe(100);
    expect(resizeCrop(crop, "se", -30, 10, bounds, 20).width).toBe(50);
    expect(resizeCrop(crop, "nw", -5, -20, bounds, 20).width).toBe(100);
  });

  it("lets the bounds win when they are smaller than the minimum", () => {
    const tiny: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const box: Rect = { x: 0, y: 0, width: 8, height: 8 };
    expect(resizeCrop(box, "se", 100, 100, tiny, 64).width).toBe(10);
  });
});

describe("zoomCrop", () => {
  it("resizes around the center", () => {
    expect(zoomCrop(crop, 100, bounds, 20)).toEqual({ x: 40, y: 50, width: 100, height: 100 });
  });

  it("clamps to the min and max sizes", () => {
    expect(zoomCrop(crop, 1, bounds, 20).width).toBe(20);
    expect(zoomCrop(crop, 999, bounds, 20).width).toBe(120);
  });

  it("shifts back inside the bounds near an edge", () => {
    const edge: Rect = { x: 120, y: 80, width: 80, height: 80 };
    expect(zoomCrop(edge, 120, bounds, 20)).toEqual({ x: 80, y: 40, width: 120, height: 120 });
  });
});

describe("toSourceRect", () => {
  const imageRect: Rect = { x: 0, y: 75, width: 300, height: 150 };

  it("maps stage coordinates to source pixels", () => {
    const area: Rect = { x: 30, y: 90, width: 90, height: 90 };
    expect(toSourceRect(area, imageRect, { width: 3000, height: 1500 })).toEqual({
      x: 300,
      y: 150,
      width: 900,
      height: 900,
    });
  });

  it("rounds and clamps inside the image", () => {
    const area: Rect = { x: 210.4, y: 75, width: 150, height: 150 };
    const rect = toSourceRect(area, imageRect, { width: 301, height: 150 });
    expect(rect.x + rect.width).toBeLessThanOrEqual(301);
    expect(rect.y + rect.height).toBeLessThanOrEqual(150);
    expect(Number.isInteger(rect.x)).toBe(true);
  });

  it("keeps a tiny image at least one pixel", () => {
    const rect = toSourceRect(
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 0, y: 0, width: 300, height: 300 },
      { width: 4, height: 4 },
    );
    expect(rect).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});
