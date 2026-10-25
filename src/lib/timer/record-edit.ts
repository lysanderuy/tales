import { formatClock, localDateKey, zonedInstant } from "@/lib/time/zone";
import {
  editsFromRecord,
  normalizeNote,
  subjectUpdate,
  type EndMethodTag,
  type EndScreenEdits,
} from "@/lib/timer/end-screen";
import type { SessionResponse } from "@/validators/study-session.validator";

export interface RecordEdits extends EndScreenEdits {
  start: string;
  end: string;
}

export type EditableRecord = Pick<
  SessionResponse,
  "nodeId" | "blockId" | "eventId" | "methodTag" | "note" | "startedAt" | "endedAt"
>;

export interface RecordPatch {
  nodeId?: string;
  blockId?: string;
  eventId?: string | null;
  methodTag?: EndMethodTag | null;
  note?: string | null;
  startedAt?: string;
  endedAt?: string;
}

export type RecordPatchResult =
  { ok: true; patch: RecordPatch } | { ok: false; error: "endBeforeStart" | "timeRequired" };

export function recordEdits(record: EditableRecord, timeZone: string): RecordEdits {
  return {
    ...editsFromRecord(record),
    start: formatClock(new Date(record.startedAt), timeZone),
    end: record.endedAt ? formatClock(new Date(record.endedAt), timeZone) : "",
  };
}

function editedInstant(original: Date, clock: string, timeZone: string): Date | null {
  try {
    return zonedInstant(localDateKey(original, timeZone), clock, timeZone);
  } catch {
    return null;
  }
}

export function buildRecordPatch(
  record: EditableRecord,
  edits: RecordEdits,
  timeZone: string,
): RecordPatchResult {
  const patch: RecordPatch = { ...subjectUpdate(record, edits) };
  if (edits.eventId !== record.eventId) patch.eventId = edits.eventId;
  if (edits.methodTag !== record.methodTag) patch.methodTag = edits.methodTag;
  const note = normalizeNote(edits.note);
  if (note !== normalizeNote(record.note ?? "")) patch.note = note;

  const startedAt = new Date(record.startedAt);
  const endedAt = record.endedAt ? new Date(record.endedAt) : null;
  let nextStart = startedAt;
  let nextEnd = endedAt;

  if (edits.start !== formatClock(startedAt, timeZone)) {
    const instant = editedInstant(startedAt, edits.start, timeZone);
    if (!instant) return { ok: false, error: "timeRequired" };
    nextStart = instant;
    patch.startedAt = instant.toISOString();
  }
  if (endedAt && edits.end !== formatClock(endedAt, timeZone)) {
    const instant = editedInstant(endedAt, edits.end, timeZone);
    if (!instant) return { ok: false, error: "timeRequired" };
    nextEnd = instant;
    patch.endedAt = instant.toISOString();
  }

  const timesChanged = patch.startedAt !== undefined || patch.endedAt !== undefined;
  if (timesChanged && nextEnd && nextStart.getTime() >= nextEnd.getTime()) {
    return { ok: false, error: "endBeforeStart" };
  }
  return { ok: true, patch };
}

export function isEmptyPatch(patch: RecordPatch): boolean {
  return Object.keys(patch).length === 0;
}
