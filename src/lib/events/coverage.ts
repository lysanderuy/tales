import type { EventMark } from "@/lib/events/marks";

export type CoverageDraft = {
  covers: readonly (string | null)[];
  marks: Readonly<Record<string, EventMark>>;
};

function without(marks: Readonly<Record<string, EventMark>>, nodeId: string) {
  return Object.fromEntries(Object.entries(marks).filter(([id]) => id !== nodeId));
}

export function replaceCover(draft: CoverageDraft, index: number, nodeId: string): CoverageDraft {
  const previous = draft.covers[index];
  if (previous === nodeId || draft.covers.some((id, i) => i !== index && id === nodeId)) {
    return draft;
  }
  const covers = draft.covers.map((id, i) => (i === index ? nodeId : id));
  if (!previous || !(previous in draft.marks)) return { covers, marks: draft.marks };
  const carried =
    nodeId in draft.marks ? draft.marks : { ...draft.marks, [nodeId]: draft.marks[previous] };
  return { covers, marks: without(carried, previous) };
}

export function removeCover(draft: CoverageDraft, index: number): CoverageDraft {
  const removed = draft.covers[index];
  return {
    covers: draft.covers.filter((_, i) => i !== index),
    marks: removed ? without(draft.marks, removed) : draft.marks,
  };
}

export function setMark(
  draft: CoverageDraft,
  nodeId: string,
  mark: EventMark | null,
): CoverageDraft {
  return {
    covers: draft.covers,
    marks: mark === null ? without(draft.marks, nodeId) : { ...draft.marks, [nodeId]: mark },
  };
}

export function coverIdsOf(covers: readonly (string | null)[]): string[] {
  return [...new Set(covers.filter((id): id is string => id !== null))];
}
