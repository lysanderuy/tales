import { messages } from "@/lib/messages";
import type { EventDetailResponse } from "@/validators/event.validator";

export type EventMark = EventDetailResponse["marks"][number]["mark"];

export type MarkChange = { nodeId: string; mark: EventMark | null };

export function marksToRecord(
  marks: readonly { nodeId: string; mark: EventMark }[],
): Record<string, EventMark> {
  return Object.fromEntries(marks.map((entry) => [entry.nodeId, entry.mark]));
}

export function diffMarks(
  original: readonly { nodeId: string; mark: EventMark }[],
  draft: Readonly<Record<string, EventMark>>,
): MarkChange[] {
  const before = marksToRecord(original);
  const changes: MarkChange[] = [];
  for (const [nodeId, mark] of Object.entries(draft)) {
    if (before[nodeId] !== mark) changes.push({ nodeId, mark });
  }
  for (const nodeId of Object.keys(before)) {
    if (!(nodeId in draft)) changes.push({ nodeId, mark: null });
  }
  return changes;
}

export function markLabel(mark: EventMark): string {
  return mark === "confident" ? messages.eventsConfident : messages.eventsReviewAgain;
}
