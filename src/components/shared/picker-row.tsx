import { CheckIcon, ChevronRightIcon } from "@/components/shared/icons";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";

type PickerRowButtonProps = {
  name: string;
  sub?: string | null;
  color?: string;
  right?: string | null;
  checked: boolean;
  chevron?: boolean;
  active?: boolean;
  strong?: boolean;
  indent?: number;
  nodeId?: string;
  onClick: () => void;
  onMouseEnter?: () => void;
};

export function PickerRowButton({
  name,
  sub,
  color,
  right,
  checked,
  chevron,
  active,
  strong,
  indent,
  nodeId,
  onClick,
  onMouseEnter,
}: PickerRowButtonProps) {
  return (
    <button
      type="button"
      data-picker-row=""
      data-node-id={nodeId}
      data-expandable={chevron ? "" : undefined}
      aria-current={checked || undefined}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={indent ? { paddingLeft: 12 + indent } : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-row px-3 py-[9px] text-left text-ui hover:bg-fill focus-visible:outline-offset-[-2px]",
        active && "bg-fill",
      )}
    >
      {color ? <Swatch color={color} /> : null}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate", strong && "font-semibold")}>{name}</span>
        {sub ? <span className="block truncate text-eyebrow text-text-faint">{sub}</span> : null}
      </span>
      {right ? (
        <span className="num whitespace-nowrap text-caption text-text-soft">{right}</span>
      ) : null}
      {checked ? (
        <span className="inline-flex text-primary">
          <CheckIcon />
        </span>
      ) : null}
      {chevron ? (
        <span className="inline-flex text-text-faint">
          <ChevronRightIcon />
        </span>
      ) : null}
    </button>
  );
}
