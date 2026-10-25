"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import { fitContain, initialCrop, toSourceRect, type Rect, type Size } from "@/lib/settings/crop";

const MIN_SIZE = 64;

function rescale(crop: Rect, from: Rect, to: Rect): Rect {
  const factor = to.width / from.width;
  return {
    x: to.x + (crop.x - from.x) * factor,
    y: to.y + (crop.y - from.y) * factor,
    width: crop.width * factor,
    height: crop.height * factor,
  };
}

export function useCropBox(
  stageRef: RefObject<HTMLElement | null>,
  size: Size,
  onRegionChange: (region: Rect) => void,
): {
  imageRect: Rect | null;
  crop: Rect | null;
  setCrop: Dispatch<SetStateAction<Rect | null>>;
  minSize: number;
} {
  const [side, setSide] = useState(0);
  const [crop, setCrop] = useState<Rect | null>(null);
  const lastRectRef = useRef<Rect | null>(null);
  const imageRect = useMemo(
    () => (side ? fitContain(size, { width: side, height: side }) : null),
    [side, size],
  );
  const minSize = imageRect ? Math.min(MIN_SIZE, imageRect.width, imageRect.height) : MIN_SIZE;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(() => setSide(stage.clientWidth));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef]);

  // Keeps the box on the same part of the picture when the stage changes width.
  useEffect(() => {
    if (!imageRect) return;
    const previous = lastRectRef.current;
    lastRectRef.current = imageRect;
    setCrop((current) =>
      current && previous ? rescale(current, previous, imageRect) : initialCrop(imageRect),
    );
  }, [imageRect]);

  useEffect(() => {
    if (crop && imageRect) onRegionChange(toSourceRect(crop, imageRect, size));
  }, [crop, imageRect, size, onRegionChange]);

  return { imageRect, crop, setCrop, minSize };
}
