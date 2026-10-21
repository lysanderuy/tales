import type { SessionResponse } from "@/validators/study-session.validator";

export type EndMethodTag = NonNullable<SessionResponse["methodTag"]>;

export interface EndScreenEdits {
  nodeId: string | null;
  blockId: string | null;
  methodTag: EndMethodTag | null;
  note: string;
}

export interface EndScreenUpdate {
  nodeId?: string;
  blockId?: string;
  methodTag: EndMethodTag | null;
  note: string | null;
}

export function editsFromRecord(
  record: Pick<SessionResponse, "nodeId" | "blockId" | "methodTag" | "note">,
): EndScreenEdits {
  return {
    nodeId: record.nodeId,
    blockId: record.blockId,
    methodTag: record.methodTag,
    note: record.note ?? "",
  };
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
  record: Pick<SessionResponse, "nodeId" | "blockId">,
  edits: EndScreenEdits,
): EndScreenUpdate {
  return {
    ...subjectUpdate(record, edits),
    methodTag: edits.methodTag,
    note: normalizeNote(edits.note),
  };
}
