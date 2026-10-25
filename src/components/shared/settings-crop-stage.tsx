"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

import { SettingsCropHandle } from "@/components/shared/settings-crop-handle";
import { SettingsCropZoom } from "@/components/shared/settings-crop-zoom";
import { useCropBox } from "@/hooks/use-crop-box";
import { messages } from "@/lib/messages";
import {
  moveCrop,
  resizeCrop,
  zoomCrop,
  type Corner,
  type Rect,
  type Size,
} from "@/lib/settings/crop";

const STEP = 4;
const STEP_LARGE = 16;

const CORNER_LABELS: Record<Corner, string> = {
  nw: messages.settingsCropResizeNw,
  ne: messages.settingsCropResizeNe,
  sw: messages.settingsCropResizeSw,
  se: messages.settingsCropResizeSe,
};
const CORNER_KEYS = Object.keys(CORNER_LABELS) as Corner[];

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

type Drag = {
  id: number;
  x: number;
  y: number;
  start: Rect;
  apply: (start: Rect, dx: number, dy: number) => Rect;
};

type SettingsCropStageProps = {
  url: string;
  size: Size;
  onRegionChange: (region: Rect) => void;
};

export function SettingsCropStage({ url, size, onRegionChange }: SettingsCropStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const { imageRect, crop, setCrop, minSize } = useCropBox(stageRef, size, onRegionChange);

  function begin(event: PointerEvent<HTMLElement>, apply: Drag["apply"]) {
    if (!crop) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: crop,
      apply,
    };
  }

  function track(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    setCrop(drag.apply(drag.start, event.clientX - drag.x, event.clientY - drag.y));
  }

  function end() {
    dragRef.current = null;
  }

  function onMoveKey(event: KeyboardEvent) {
    const arrow = ARROWS[event.key];
    if (!arrow || !crop || !imageRect) return;
    event.preventDefault();
    const step = event.shiftKey ? STEP_LARGE : STEP;
    setCrop(moveCrop(crop, arrow[0] * step, arrow[1] * step, imageRect));
  }

  function onResizeKey(event: KeyboardEvent, corner: Corner) {
    const arrow = ARROWS[event.key];
    if (!arrow || !crop || !imageRect) return;
    event.preventDefault();
    const step = (event.shiftKey ? STEP_LARGE : STEP) * (arrow[0] + arrow[1]);
    setCrop(resizeCrop(crop, corner, step, step, imageRect, minSize));
  }

  const pointer = { onPointerMove: track, onPointerUp: end, onPointerCancel: end };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className="relative mx-auto aspect-square w-full max-w-[400px] touch-none select-none overflow-hidden rounded-field bg-black/85"
      >
        {imageRect && crop ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not optimizable */}
            <img
              src={url}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                left: imageRect.x,
                top: imageRect.y,
                width: imageRect.width,
                height: imageRect.height,
              }}
            />
            <div
              className="absolute rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(0,0,0,0.25),0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
            >
              <button
                type="button"
                aria-label={messages.settingsCropArea}
                className="absolute inset-0 cursor-grab touch-none rounded-full outline-offset-4 active:cursor-grabbing"
                onPointerDown={(event) =>
                  begin(event, (s, dx, dy) => moveCrop(s, dx, dy, imageRect))
                }
                onKeyDown={onMoveKey}
                {...pointer}
              />
              {CORNER_KEYS.map((corner) => (
                <SettingsCropHandle
                  key={corner}
                  corner={corner}
                  label={CORNER_LABELS[corner]}
                  onPointerDown={(event) =>
                    begin(event, (s, dx, dy) => resizeCrop(s, corner, dx, dy, imageRect, minSize))
                  }
                  onKeyDown={(event) => onResizeKey(event, corner)}
                  {...pointer}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      {imageRect && crop ? (
        <>
          <SettingsCropZoom
            min={Math.round(minSize)}
            max={Math.round(Math.min(imageRect.width, imageRect.height))}
            value={Math.round(crop.width)}
            onChange={(value) => setCrop(zoomCrop(crop, value, imageRect, minSize))}
          />
          <p className="text-center text-caption text-text-faint">{messages.settingsCropHint}</p>
        </>
      ) : null}
    </div>
  );
}
