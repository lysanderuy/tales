"use client";

import { PlayIcon } from "@/components/shared/icons";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { useNextUp } from "@/hooks/use-next-up";
import { messages } from "@/lib/messages";
import type { SubjectIndex } from "@/lib/today/subject-index";

type EndScreenNextUpProps = {
  excludeBlockId: string | null;
  index: SubjectIndex;
  disabled: boolean;
  onStart: (blockId: string) => void;
};

export function EndScreenNextUp({
  excludeBlockId,
  index,
  disabled,
  onStart,
}: EndScreenNextUpProps) {
  const nextUp = useNextUp(excludeBlockId).data;
  if (!nextUp || nextUp.blockId === excludeBlockId) return null;

  const name = index.get(nextUp.nodeId)?.name ?? messages.todayUnknownSubject;
  const text = nextUp.minutesLeft === null ? name : `${name} · ${nextUp.minutesLeft} min`;

  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 text-left text-body">
      <div className="min-w-0">
        <Eyebrow as="div" className="mb-0.5">
          {messages.endNextUp}
        </Eyebrow>
        <div title={text} className="num truncate">
          {text}
        </div>
      </div>
      <IconButton
        size="xs"
        variant="tint"
        label={messages.endStartNext}
        disabled={disabled}
        onClick={() => onStart(nextUp.blockId)}
      >
        <PlayIcon size={16} />
      </IconButton>
    </div>
  );
}
