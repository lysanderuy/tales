import type { SessionResponse } from "@/validators/study-session.validator";

export type EndMethodTag = SessionResponse["methodTags"][number];

export interface EndScreenEdits {
  nodeId: string | null;
  blockId: string | null;
  eventId: string | null;
  methodTags: EndMethodTag[];
  note: string;
}

export interface EndScreenUpdate {
  nodeId?: string;
  blockId?: string;
  eventId?: string | null;
  methodTags: EndMethodTag[];
  note: string | null;
}

export function editsFromRecord(
  record: Pick<SessionResponse, "nodeId" | "blockId" | "eventId" | "methodTags" | "note">,
): EndScreenEdits {
  return {
    nodeId: record.nodeId,
    blockId: record.blockId,
    eventId: record.eventId,
    methodTags: record.methodTags,
    note: record.note ?? "",
  };
}

export function sameMethodTags(a: EndMethodTag[], b: EndMethodTag[]): boolean {
  return a.length === b.length && a.every((tag) => b.includes(tag));
}

export function subjectUpdate(
  record: Pick<SessionResponse, "nodeId" | "blockId">,
  edits: Pick<EndScreenEdits, "nodeId" | "blockId">,
): Pick<EndScreenUpdate, "nodeId" | "blockId"> {
  const subjectChanged = edits.nodeId !== record.nodeId || edits.blockId !== record.blockId;
  if (!subjectChanged || edits.nodeId === null) return {};
  return edits.blockId ? { blockId: edits.blockId } : { nodeId: edits.nodeId };
}

export function normalizeNote(note: string): string | null {
  return note.trim() === "" ? null : note;
}

export function buildEndScreenUpdate(
  record: Pick<SessionResponse, "nodeId" | "blockId" | "eventId">,
  edits: EndScreenEdits,
): EndScreenUpdate {
  return {
    ...subjectUpdate(record, edits),
    ...(edits.eventId !== record.eventId && { eventId: edits.eventId }),
    methodTags: edits.methodTags,
    note: normalizeNote(edits.note),
  };
}
