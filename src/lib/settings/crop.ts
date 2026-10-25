export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Corner = "nw" | "ne" | "sw" | "se";

const INITIAL_FRACTION = 0.8;
export const MAX_SOURCE_PIXELS = 40_000_000;

export function exceedsPixelCap(size: Size): boolean {
  return size.width * size.height > MAX_SOURCE_PIXELS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function fitContain(image: Size, stage: Size): Rect {
  const scale = Math.min(stage.width / image.width, stage.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (stage.width - width) / 2, y: (stage.height - height) / 2, width, height };
}

export function initialCrop(imageRect: Rect): Rect {
  const size = Math.min(imageRect.width, imageRect.height) * INITIAL_FRACTION;
  return {
    x: imageRect.x + (imageRect.width - size) / 2,
    y: imageRect.y + (imageRect.height - size) / 2,
    width: size,
    height: size,
  };
}

export function moveCrop(crop: Rect, dx: number, dy: number, bounds: Rect): Rect {
  return {
    ...crop,
    x: clamp(crop.x + dx, bounds.x, bounds.x + bounds.width - crop.width),
    y: clamp(crop.y + dy, bounds.y, bounds.y + bounds.height - crop.height),
  };
}

export function resizeCrop(
  crop: Rect,
  corner: Corner,
  dx: number,
  dy: number,
  bounds: Rect,
  minSize: number,
): Rect {
  const east = corner === "ne" || corner === "se";
  const south = corner === "sw" || corner === "se";
  const anchorX = east ? crop.x : crop.x + crop.width;
  const anchorY = south ? crop.y : crop.y + crop.height;

  // The square follows the axis the pointer has moved furthest along, so it tracks the cursor 1:1.
  const outX = east ? dx : -dx;
  const outY = south ? dy : -dy;
  const growth = Math.abs(outX) >= Math.abs(outY) ? outX : outY;
  const roomX = east ? bounds.x + bounds.width - anchorX : anchorX - bounds.x;
  const roomY = south ? bounds.y + bounds.height - anchorY : anchorY - bounds.y;
  const maxSize = Math.min(roomX, roomY);
  const size = Math.min(Math.max(crop.width + growth, minSize), maxSize);

  return {
    x: east ? anchorX : anchorX - size,
    y: south ? anchorY : anchorY - size,
    width: size,
    height: size,
  };
}

export function zoomCrop(crop: Rect, size: number, bounds: Rect, minSize: number): Rect {
  const maxSize = Math.min(bounds.width, bounds.height);
  const next = Math.min(Math.max(size, minSize), maxSize);
  const centerX = crop.x + crop.width / 2;
  const centerY = crop.y + crop.height / 2;
  return {
    x: clamp(centerX - next / 2, bounds.x, bounds.x + bounds.width - next),
    y: clamp(centerY - next / 2, bounds.y, bounds.y + bounds.height - next),
    width: next,
    height: next,
  };
}

export function toSourceRect(crop: Rect, imageRect: Rect, natural: Size): Rect {
  const scale = natural.width / imageRect.width;
  const size = clamp(Math.round(crop.width * scale), 1, Math.min(natural.width, natural.height));
  return {
    x: clamp(Math.round((crop.x - imageRect.x) * scale), 0, natural.width - size),
    y: clamp(Math.round((crop.y - imageRect.y) * scale), 0, natural.height - size),
    width: size,
    height: size,
  };
}
