import { METHODS } from "@/components/shared/focus-tools";
import { cn } from "@/lib/cn";
import type { EndMethodTag } from "@/lib/timer/end-screen";

type EndScreenMethodsProps = {
  value: EndMethodTag | null;
  onChange: (value: EndMethodTag | null) => void;
  className?: string;
};

export function EndScreenMethods({ value, onChange, className }: EndScreenMethodsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {METHODS.map(({ tag, label }) => (
        <button
          key={tag}
          type="button"
          aria-pressed={value === tag}
          onClick={() => onChange(value === tag ? null : tag)}
          className={cn(
            "press rounded-full px-[11px] py-[7px] text-ui",
            value === tag
              ? "bg-primary-soft font-medium text-primary"
              : "bg-fill hover:bg-fill-hover",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
