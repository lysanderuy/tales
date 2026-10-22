"use client";

import { useCallback, useRef, useState } from "react";

import { MoreIcon } from "@/components/shared/icons";
import { SubjectsMoveMenu } from "@/components/shared/subjects-move-menu";
import { useDismiss } from "@/components/shared/use-dismiss";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";
import type { ChildrenMap, SubjectNode } from "@/lib/subjects/tree";
import type { SubjectIndex } from "@/lib/today/subject-index";

type SubjectsDetailMenuProps = {
  node: SubjectNode;
  topicCount: number;
  childMap: ChildrenMap;
  index: SubjectIndex;
  onRename: () => void;
  onMove: (parentId: string | null) => void;
  onArchive: (archived: boolean) => void;
  onDelete: () => void;
};

type Mode = "menu" | "confirm";

const itemClass = "flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill";

export function SubjectsDetailMenu({
  node,
  topicCount,
  childMap,
  index,
  onRename,
  onMove,
  onArchive,
  onDelete,
}: SubjectsDetailMenuProps) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const [moving, setMoving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setMode(null), []);
  useDismiss(containerRef, triggerRef, mode !== null, close);

  const canDelete = (node.totals?.totalSeconds ?? 0) === 0;
  const deleteLabel =
    topicCount > 0
      ? `${messages.subjectsDeleteWith} ${topicCount} ${topicCount === 1 ? messages.subjectsTopicOne : messages.subjectsTopicMany}`
      : `${messages.subjectsDelete} ${node.name}`;

  const items =
    mode === "confirm"
      ? [
          { label: deleteLabel, run: onDelete },
          { label: messages.subjectsKeepIt, run: () => undefined },
        ]
      : [
          { label: messages.subjectsRename, run: onRename },
          {
            label: messages.subjectsMove,
            run: () => setMoving(true),
          },
          {
            label: node.archived ? messages.subjectsRestore : messages.subjectsArchive,
            run: () => onArchive(!node.archived),
          },
          ...(canDelete
            ? [{ label: messages.subjectsDelete, run: () => setMode("confirm"), keepOpen: true }]
            : []),
        ];

  return (
    <div className="relative">
      <IconButton
        ref={(element) => {
          triggerRef.current = element;
          setTrigger(element);
        }}
        size="sm"
        label={messages.subjectsMore}
        aria-haspopup="true"
        aria-expanded={mode !== null}
        onClick={() => setMode((current) => (current ? null : "menu"))}
      >
        <MoreIcon size={20} />
      </IconButton>
      {mode ? (
        <div
          ref={containerRef}
          data-subjects-layer=""
          className="absolute right-0 top-[48px] z-[6] w-60 rounded-field border border-border bg-surface p-2"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={itemClass}
              onClick={() => {
                if (!("keepOpen" in item)) close();
                item.run();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {moving && trigger ? (
        <SubjectsMoveMenu
          node={node}
          childMap={childMap}
          index={index}
          anchor={trigger}
          onPick={onMove}
          onClose={() => setMoving(false)}
        />
      ) : null}
    </div>
  );
}
