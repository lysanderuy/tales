import { cn } from "@/lib/cn";

type SwatchProps = { color: string; className?: string };

export function Swatch({ color, className }: SwatchProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-[10px] shrink-0 rounded-[3px]", className)}
      style={{ background: color }}
    />
  );
}
