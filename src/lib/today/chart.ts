export const CHART_MIN_SCALE_MINUTES = 300;
export const CHART_BAR_AREA_PX = 140;
export const CHART_MIN_SEGMENT_PX = 4;

export function chartScaleMinutes(dayTotalsSeconds: readonly number[]): number {
  const largest = Math.max(0, ...dayTotalsSeconds) / 60;
  return Math.max(CHART_MIN_SCALE_MINUTES, largest);
}

export function segmentHeightPx(seconds: number, scaleMinutes: number): number {
  const px = Math.round((seconds / 60 / scaleMinutes) * CHART_BAR_AREA_PX);
  return Math.max(CHART_MIN_SEGMENT_PX, px);
}
