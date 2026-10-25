export interface SessionEventInput {
  explicit: string | null | undefined;
  current: string | null;
  blockEventId: string | null;
  blockAttached: boolean;
}

export function resolveSessionEvent({
  explicit,
  current,
  blockEventId,
  blockAttached,
}: SessionEventInput): string | null | undefined {
  if (explicit !== undefined) return explicit;
  if (blockAttached && current === null) return blockEventId;
  return undefined;
}
