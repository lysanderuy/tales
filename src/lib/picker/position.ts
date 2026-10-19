export const EDGE = 8;
export const PICKER_WIDTH = 320;
export const PANEL_WIDTH = 280;
export const PICKER_MAX_HEIGHT = 470;

export interface AnchorRect {
  left: number;
  top: number;
  bottom: number;
  width: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface FloatingPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
}

function clampLeft(left: number, width: number, viewport: Viewport): number {
  return Math.max(EDGE, Math.min(left, viewport.width - width - EDGE));
}

export function placeFloating(
  anchor: AnchorRect,
  width: number,
  height: number,
  viewport: Viewport,
): FloatingPlacement {
  const left = clampLeft(anchor.left + anchor.width / 2 - width / 2, width, viewport);
  const below = anchor.bottom + EDGE;
  if (below + height <= viewport.height - EDGE) return { left, top: below, bottom: null };

  const aboveEdge = anchor.top - EDGE;
  if (aboveEdge - height >= EDGE) return { left, top: null, bottom: viewport.height - aboveEdge };

  return { left, top: Math.max(EDGE, viewport.height - EDGE - height), bottom: null };
}

export interface SidePlacement {
  left: number;
  fits: boolean;
}

export function placeSide(
  pickerLeft: number,
  pickerWidth: number,
  panelWidth: number,
  viewport: Viewport,
): SidePlacement {
  const right = pickerLeft + pickerWidth + EDGE;
  if (right + panelWidth <= viewport.width - EDGE) return { left: right, fits: true };

  const left = pickerLeft - EDGE - panelWidth;
  return { left, fits: left >= EDGE };
}
