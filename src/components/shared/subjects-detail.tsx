"use client";

import { ArchiveIcon, CloseIcon } from "@/components/shared/icons";
import { SubjectsDetailMenu } from "@/components/shared/subjects-detail-menu";
import { SubjectsStudyLog } from "@/components/shared/subjects-study-log";
import { SubjectsWeightField } from "@/components/shared/subjects-weight-field";
import type { SubjectActions } from "@/components/shared/use-subjects-actions";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { Swatch } from "@/components/ui/swatch";
import { useProfile } from "@/hooks/use-profile";
import { useSubjectSessions } from "@/hooks/use-subject-sessions";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import type { ChildrenMap, SubjectNode } from "@/lib/subjects/tree";
import { formatSeconds, splitTotal } from "@/lib/today/format";
import { formatPath, type SubjectIndex } from "@/lib/today/subject-index";

type SubjectsDetailProps = {
  node: SubjectNode;
  parent: SubjectNode | null;
  index: SubjectIndex;
  childMap: ChildrenMap;
  topicCount: number;
  actions: SubjectActions;
  className?: string;
  onRename: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
};

const unitClass = "ml-[.12em] mr-[.35em] text-body tracking-normal text-text-faint";
const rowClass = "flex items-center gap-2.5 py-[7px] text-ui";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={rowClass}>
      {label}
      <span className="num ml-auto text-text-soft">{value}</span>
    </div>
  );
}

function Total({ seconds }: { seconds: number }) {
  if (seconds <= 0) {
    return (
      <div className="my-2 mb-4 text-h2 leading-[1.3] tracking-[-0.01em] text-text-faint">
        {messages.subjectsNoTime}
      </div>
    );
  }
  const { hours, minutes } = splitTotal(seconds);
  return (
    <div className="num mb-4 mt-2 text-total leading-none tracking-[-0.03em] text-time">
      {hours > 0 ? (
        <>
          {hours}
          <small className={unitClass}>h</small>
        </>
      ) : null}
      {hours === 0 || minutes > 0 ? (
        <>
          {minutes}
          <small className={unitClass}>min</small>
        </>
      ) : null}
    </div>
  );
}

export function SubjectsDetail({
  node,
  parent,
  index,
  childMap,
  topicCount,
  actions,
  className,
  onRename,
  onSelect,
  onClose,
}: SubjectsDetailProps) {
  const sessions = useSubjectSessions(node.id);
  const profile = useProfile();

  const info = index.get(node.id);
  const color = info?.color ?? "var(--border)";
  const totals = node.totals;
  const total = totals?.totalSeconds ?? 0;
  const own = totals?.ownSeconds ?? 0;
  const dim = node.effectivelyArchived;
  const showSplit = own > 0 && total - own > 0;

  return (
    <Card className={className}>
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h2
            className={cn(
              "flex min-w-0 items-center gap-2 text-h2 font-semibold tracking-[-0.01em]",
              dim && "text-text-soft",
            )}
          >
            <Swatch color={color} className={cn(dim && "opacity-60 grayscale")} />
            <span title={node.name} className="min-w-0 truncate">
              {node.name}
            </span>
          </h2>
          <div className="flex shrink-0 gap-1.5">
            <SubjectsDetailMenu
              node={node}
              topicCount={topicCount}
              childMap={childMap}
              index={index}
              onRename={onRename}
              onMove={(parentId) => actions.move(node, parentId)}
              onArchive={(archived) => actions.setArchived(node, archived)}
              onDelete={() => actions.remove(node)}
            />
            <IconButton size="sm" label={messages.subjectsClose} onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        {parent ? (
          <button
            type="button"
            title={formatPath(info?.ancestors ?? [])}
            onClick={() => onSelect(parent.id)}
            className="-mx-0.5 mt-0.5 block max-w-full truncate rounded-[6px] px-0.5 text-left text-caption text-text-faint hover:bg-fill hover:text-text-soft"
          >
            {messages.subjectsIn(parent.name)}
          </button>
        ) : null}
      </div>

      {dim ? (
        <div
          title={messages.subjectsArchivedNote}
          className="-mt-1.5 mb-3.5 flex items-center gap-2.5 rounded-full bg-fill py-1.5 pl-3.5 pr-1.5 text-small text-text-soft"
        >
          <span className="flex text-text-faint">
            <ArchiveIcon size={16} />
          </span>
          <span className="flex-1">
            {node.archived ? messages.subjectsArchived : messages.subjectsArchivedWithParent}
          </span>
          {node.archived ? (
            <button
              type="button"
              onClick={() => actions.setArchived(node, false)}
              className="rounded-full px-3 py-1.5 text-small text-primary hover:bg-fill-hover"
            >
              {messages.subjectsRestore}
            </button>
          ) : null}
        </div>
      ) : null}

      {node.parentId !== null ? (
        <SubjectsWeightField
          key={`${node.id}:${node.examWeight}`}
          value={node.examWeight}
          onCommit={(value) => actions.setWeight(node, value)}
        />
      ) : null}

      <Eyebrow as="div" className="mt-3">
        {messages.subjectsAllTime}
      </Eyebrow>
      <Total seconds={total} />
      <div>
        {total > 0 ? (
          <StatRow
            label={messages.subjectsLast7Days}
            value={formatSeconds(totals?.last7DaysSeconds ?? 0)}
          />
        ) : null}
        {showSplit ? (
          <>
            <StatRow label={messages.subjectsOnThisItem} value={formatSeconds(own)} />
            <StatRow label={messages.subjectsInTopicsBelow} value={formatSeconds(total - own)} />
          </>
        ) : null}
      </div>

      <SubjectsStudyLog
        records={sessions.data ?? []}
        index={index}
        timeZone={profile.data?.timeZone ?? null}
      />
    </Card>
  );
}
