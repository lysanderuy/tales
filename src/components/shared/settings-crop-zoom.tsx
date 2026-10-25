import { PlusIcon } from "@/components/shared/icons";
import { messages } from "@/lib/messages";

type SettingsCropZoomProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

function MinusIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

export function SettingsCropZoom({ min, max, value, onChange }: SettingsCropZoomProps) {
  return (
    <div className="mx-auto flex w-full max-w-[400px] items-center gap-3 text-text-soft">
      <MinusIcon />
      <input
        type="range"
        aria-label={messages.settingsCropZoom}
        min={min}
        max={max}
        step={1}
        value={value}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-fill accent-primary [&::-moz-range-thumb]:size-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <PlusIcon size={16} />
    </div>
  );
}
