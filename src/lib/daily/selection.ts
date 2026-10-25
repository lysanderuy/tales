export const DAILY_VERSE_SET_ID = "6f1a2b3c-0003-4000-8000-000000000003";

export function resolveSelectedSetId(
  readableIdsInOrder: readonly string[],
  onIds: ReadonlySet<string>,
): string | undefined {
  const explicit = readableIdsInOrder.find((id) => onIds.has(id));
  if (explicit) return explicit;
  return readableIdsInOrder.includes(DAILY_VERSE_SET_ID)
    ? DAILY_VERSE_SET_ID
    : readableIdsInOrder[0];
}
