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

export function buildEndScreenUpdate(
  record: Pick<SessionResponse, "nodeId" | "blockId">,
  edits: EndScreenEdits,
): EndScreenUpdate {
  const subjectChanged = edits.nodeId !== record.nodeId || edits.blockId !== record.blockId;
  const subject: Pick<EndScreenUpdate, "nodeId" | "blockId"> = {};
  if (subjectChanged && edits.nodeId !== null) {
    if (edits.blockId) subject.blockId = edits.blockId;
    else subject.nodeId = edits.nodeId;
  }
  return {
    ...subject,
    methodTag: edits.methodTag,
    note: edits.note.trim() === "" ? null : edits.note,
  };
}
