import { useDraggable, useDroppable } from "@dnd-kit/core";

import { ArchiveIcon, ChevronRightIcon } from "@/components/shared/icons";
import { SubjectsRenameInput } from "@/components/shared/subjects-rename-input";
import { Swatch } from "@/components/ui/swatch";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import type { DropKind } from "@/lib/subjects/drop";
import { highlightParts, type SubjectRow } from "@/lib/subjects/tree";

export type RenameConfig = {
  names: readonly string[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

type SubjectsTreeRowProps = {
  row: SubjectRow;
  color: string;
  query: string;
  selected: boolean;
  tabbable: boolean;
  dragDisabled: boolean;
  dropKind: DropKind | null;
  rename: RenameConfig | null;
  onSelect: (id: string) => void;
  onToggle: (id: string, open: boolean) => void;
};

function Name({ name, query }: { name: string; query: string }) {
  const parts = highlightParts(name, query);
  if (!parts) return name;
  return (
    <>
      {parts.before}
      <mark className="rounded-[4px] bg-primary-soft px-px text-inherit">{parts.match}</mark>
      {parts.after}
    </>
  );
}

export function SubjectsTreeRow({
  row,
  color,
  query,
  selected,
  tabbable,
  dragDisabled,
  dropKind,
  rename,
  onSelect,
  onToggle,
}: SubjectsTreeRowProps) {
  const { node, depth, hasChildren, open } = row;
  const dim = node.effectivelyArchived;
  const drag = useDraggable({ id: node.id, disabled: dragDisabled || dim });
  const drop = useDroppable({ id: node.id });
  const padding = `calc(8px + ${depth} * 16px)`;

  return (
    <div
      ref={(element) => {
        drag.setNodeRef(element);
        drop.setNodeRef(element);
      }}
      {...drag.listeners}
      role="treeitem"
      tabIndex={tabbable ? 0 : -1}
      data-node-id={node.id}
      aria-level={depth + 1}
      aria-selected={selected}
      aria-expanded={hasChildren ? open : undefined}
      onClick={() => {
        onSelect(node.id);
        if (hasChildren && !rename) onToggle(node.id, !open);
      }}
      style={{ paddingLeft: padding }}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-row py-1.5 pr-2 transition-colors duration-[var(--dur-fast)]",
        selected || dropKind === "inside" ? "bg-primary-soft" : "hover:bg-fill",
        dropKind === "inside" && "ring-1 ring-inset ring-primary",
        drag.isDragging && "opacity-40",
      )}
    >
      {dropKind === "before" || dropKind === "after" ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-0 z-[1] h-0.5 rounded-full bg-primary",
            dropKind === "before" ? "-top-px" : "-bottom-px",
          )}
          style={{ left: padding }}
        />
      ) : null}
      {hasChildren ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? messages.subjectsCollapse : messages.subjectsExpand}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(node.id, !open);
          }}
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-text-faint transition-[transform,background-color] duration-[var(--dur-fast)] hover:bg-fill-hover",
            open && "rotate-90",
          )}
        >
          <ChevronRightIcon />
        </button>
      ) : (
        <span aria-hidden="true" className="size-6 shrink-0" />
      )}
      {depth === 0 ? <Swatch color={color} className={cn(dim && "opacity-60 grayscale")} /> : null}
      {rename ? (
        <SubjectsRenameInput
          initial={node.name}
          names={rename.names}
          onSubmit={rename.onSubmit}
          onCancel={rename.onCancel}
        />
      ) : (
        <span
          title={node.name}
          className={cn(
            "min-w-0 flex-1 truncate text-ui font-medium",
            (depth === 0 || hasChildren) && "font-semibold",
            depth === 0 && "text-body",
            dim && "opacity-60",
          )}
        >
          <Name name={node.name} query={query} />
        </span>
      )}
      {node.archived ? (
        <span
          title={messages.subjectsArchived}
          aria-label={messages.subjectsArchived}
          className="inline-flex shrink-0 pr-1 text-text-faint"
        >
          <ArchiveIcon />
        </span>
      ) : null}
    </div>
  );
}
