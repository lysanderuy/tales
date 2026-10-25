import type { HTMLAttributes } from "react";

import type { Corner } from "@/lib/settings/crop";

// Where the circle meets the square's diagonals: 50% -/+ 50% / sqrt(2).
const NEAR = "14.645%";
const FAR = "85.355%";

const PLACEMENT: Record<Corner, { left: string; top: string; cursor: string }> = {
  nw: { left: NEAR, top: NEAR, cursor: "cursor-nwse-resize" },
  ne: { left: FAR, top: NEAR, cursor: "cursor-nesw-resize" },
  sw: { left: NEAR, top: FAR, cursor: "cursor-nesw-resize" },
  se: { left: FAR, top: FAR, cursor: "cursor-nwse-resize" },
};

type SettingsCropHandleProps = HTMLAttributes<HTMLButtonElement> & {
  corner: Corner;
  label: string;
};

export function SettingsCropHandle({ corner, label, ...props }: SettingsCropHandleProps) {
  const { left, top, cursor } = PLACEMENT[corner];
  return (
    <button
      type="button"
      aria-label={label}
      className={`group/handle absolute grid size-7 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full ${cursor}`}
      style={{ left, top }}
      {...props}
    >
      <span className="size-[11px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)] transition-transform group-hover/handle:scale-125 group-focus-visible/handle:scale-125 motion-reduce:transition-none" />
    </button>
  );
}
