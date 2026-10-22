"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { RunningBar } from "@/components/shared/running-bar";
import { StartControl } from "@/components/shared/start-control";
import { SubjectsDetail } from "@/components/shared/subjects-detail";
import { SubjectsEmpty } from "@/components/shared/subjects-empty";
import { SubjectsHeaderTools } from "@/components/shared/subjects-header-tools";
import { SubjectsSearch } from "@/components/shared/subjects-search";
import { SubjectsSkeleton } from "@/components/shared/subjects-skeleton";
import { SubjectsTree } from "@/components/shared/subjects-tree";
import { useSubjectActions } from "@/components/shared/use-subjects-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useSubjectsWithTotals } from "@/hooks/use-subjects-with-totals";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import {
  ancestorIds,
  buildChildrenMap,
  buildNodeMap,
  countDescendants,
  countItems,
  visibleRows,
} from "@/lib/subjects/tree";
import { buildSubjectIndex } from "@/lib/today/subject-index";
import { useToastStore } from "@/stores/toast.store";

const wide = "col-span-12 min-[900px]:col-span-7";
const narrow = "col-span-12 min-[900px]:sticky min-[900px]:top-[88px] min-[900px]:col-span-5";
const mainClass = "mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8";

export function SubjectsView() {
  const subjects = useSubjectsWithTotals();
  const { session, display } = useSessionClock();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState<{ parentId: string | null } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const showToast = useToastStore((state) => state.show);

  const nodes = subjects.data;
  const byId = useMemo(() => buildNodeMap(nodes ?? []), [nodes]);
  const childMap = useMemo(() => buildChildrenMap(nodes ?? []), [nodes]);
  const index = useMemo(() => buildSubjectIndex(nodes ?? []), [nodes]);
  const rows = useMemo(
    () => visibleRows({ children: childMap, byId, expanded, query, showArchived }),
    [childMap, byId, expanded, query, showArchived],
  );

  function expandTo(id: string) {
    setExpanded((current) => new Set([...current, ...ancestorIds(byId, id), id]));
  }

  function handleSelect(id: string | null) {
    if (id === null) setAdding(null);
    setSelectedId(id);
  }

  const actions = useSubjectActions({
    showArchived,
    onSelect: setSelectedId,
    onReveal: (id) => {
      if (id) expandTo(id);
    },
  });

  if (subjects.isError && !nodes) {
    return (
      <main className={mainClass}>
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button variant="fill" onClick={() => void subjects.refetch()}>
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!nodes) return <SubjectsSkeleton />;

  const candidate = selectedId ? byId.get(selectedId) : undefined;
  const selected = candidate && (showArchived || !candidate.effectivelyArchived) ? candidate : null;
  const parent = selected?.parentId ? (byId.get(selected.parentId) ?? null) : null;
  const { subjects: subjectCount, topics: topicCount } = countItems(nodes);
  const empty = nodes.length === 0;

  function setOpen(id: string, open: boolean) {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function revealAndSelect(id: string) {
    setExpanded((current) => new Set([...current, ...ancestorIds(byId, id)]));
    setSelectedId(id);
  }

  function siblingNames(parentId: string | null, exceptId?: string): string[] {
    return (childMap.get(parentId) ?? [])
      .filter((sibling) => sibling.id !== exceptId)
      .map((sibling) => sibling.name);
  }

  function startAdd(parentId: string | null) {
    setQuery("");
    setRenamingId(null);
    setAdding({ parentId });
    if (parentId) expandTo(parentId);
  }

  function onAdd() {
    if (selected?.effectivelyArchived) {
      showToast(messages.subjectsRestoreFirst);
      return;
    }
    startAdd(selected?.id ?? null);
  }

  function startRename(id: string) {
    setAdding(null);
    setQuery("");
    setSelectedId(id);
    setExpanded((current) => new Set([...current, ...ancestorIds(byId, id)]));
    setRenamingId(id);
  }

  const renaming = renamingId ? byId.get(renamingId) : undefined;

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !selected || adding || renamingId) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (
      target.closest(
        "input, textarea, [role='dialog'], [data-subjects-layer], [aria-expanded='true']:not([role='treeitem'])",
      )
    )
      return;
    setSelectedId(null);
  }

  return (
    <main className={mainClass}>
      <div className="mb-5 flex min-h-14 items-end justify-between gap-4">
        <div>
          {empty ? null : (
            <Eyebrow as="div" className="num">
              {`${subjectCount} ${subjectCount === 1 ? messages.subjectsSubjectOne : messages.subjectsSubjectMany}`}{" "}
              ·{" "}
              {`${topicCount} ${topicCount === 1 ? messages.subjectsTopicOne : messages.subjectsTopicMany}`}
            </Eyebrow>
          )}
          <h1 className="text-h1 font-semibold tracking-[-0.02em]">{messages.subjectsTitle}</h1>
        </div>
        {session && display ? (
          <RunningBar
            session={session}
            display={display}
            subjectName={session.nodeId ? (index.get(session.nodeId)?.name ?? null) : null}
          />
        ) : (
          <StartControl />
        )}
      </div>
      <div className="grid grid-cols-12 items-start gap-4" onKeyDown={onGridKeyDown}>
        <Card className={cn(selected ? wide : "col-span-12")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-h2 font-semibold tracking-[-0.01em]">
              {messages.subjectsAllSubjects}
            </h2>
            {empty ? null : (
              <SubjectsHeaderTools
                addLabel={
                  selected ? messages.subjectsAddUnder(selected.name) : messages.subjectsAddSubject
                }
                onAdd={onAdd}
                showArchived={showArchived}
                onToggleArchived={() => setShowArchived((value) => !value)}
              />
            )}
          </div>
          {empty && !adding ? (
            <SubjectsEmpty onAdd={() => startAdd(null)} />
          ) : (
            <>
              {empty ? null : (
                <>
                  <p className="-mt-1 mb-3 ml-0.5 min-h-[18px] truncate text-eyebrow text-text-faint">
                    {selected
                      ? messages.subjectsNewUnder(selected.name)
                      : messages.subjectsNewTopLevel}
                  </p>
                  <SubjectsSearch value={query} onChange={setQuery} />
                </>
              )}
              {rows.length === 0 && !adding ? (
                <p className="p-2 text-ui text-text-faint">{messages.pickerNoMatch}</p>
              ) : (
                <SubjectsTree
                  rows={rows}
                  byId={byId}
                  childMap={childMap}
                  colorOf={(id) => index.get(id)?.color ?? "var(--border)"}
                  query={query}
                  selectedId={selected?.id ?? null}
                  add={
                    adding
                      ? {
                          parentId: adding.parentId,
                          names: siblingNames(adding.parentId),
                          pending: actions.pending,
                          onSubmit: (name, onDone) => actions.create(adding.parentId, name, onDone),
                          onCancel: () => setAdding(null),
                        }
                      : null
                  }
                  rename={
                    renaming
                      ? {
                          id: renaming.id,
                          names: siblingNames(renaming.parentId, renaming.id),
                          onSubmit: (name) =>
                            actions.rename(renaming, name, () => setRenamingId(null)),
                          onCancel: () => setRenamingId(null),
                        }
                      : null
                  }
                  onSelect={handleSelect}
                  onSetOpen={setOpen}
                  onRenameRequest={startRename}
                  onMove={(id, args) => {
                    const moved = byId.get(id);
                    if (moved) actions.move(moved, args.parentId, args.position, true);
                  }}
                />
              )}
            </>
          )}
        </Card>
        {selected ? (
          <SubjectsDetail
            key={selected.id}
            node={selected}
            parent={parent}
            index={index}
            childMap={childMap}
            topicCount={countDescendants(childMap, selected.id)}
            actions={actions}
            className={narrow}
            onRename={() => startRename(selected.id)}
            onSelect={revealAndSelect}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </main>
  );
}
