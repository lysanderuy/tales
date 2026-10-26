import { METHODS } from "@/components/shared/focus-tools";
import { cn } from "@/lib/cn";
import type { EndMethodTag } from "@/lib/timer/end-screen";

type EndScreenMethodsProps = {
  value: EndMethodTag[];
  onChange: (value: EndMethodTag[]) => void;
  className?: string;
};

export function EndScreenMethods({ value, onChange, className }: EndScreenMethodsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {METHODS.map(({ tag, label }) => (
        <button
          key={tag}
          type="button"
          aria-pressed={value.includes(tag)}
          onClick={() =>
            onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag])
          }
          className={cn(
            "press rounded-full px-[11px] py-[7px] text-ui",
            value.includes(tag)
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
