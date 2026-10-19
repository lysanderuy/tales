export const MAX_LINE_LENGTH = 500;

export interface ChooseLineInput {
  visibleLineIds: readonly string[];
  pickHistory: readonly string[];
  random: () => number;
}

export function chooseLine({
  visibleLineIds,
  pickHistory,
  random,
}: ChooseLineInput): string | null {
  const visible = new Set(visibleLineIds);
  if (visible.size === 0) return null;

  const shown = new Set<string>();
  for (const id of pickHistory) {
    if (!visible.has(id)) continue;
    shown.add(id);
    if (shown.size === visible.size) shown.clear();
  }

  const candidates = [...visible].filter((id) => !shown.has(id));
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[Math.max(index, 0)] ?? null;
}

export interface PasteResult {
  lines: string[];
  skippedEmpty: number;
  skippedDuplicate: number;
  tooLong: number;
}

export function parsePasteLines(text: string, existing: readonly string[]): PasteResult {
  const result: PasteResult = { lines: [], skippedEmpty: 0, skippedDuplicate: 0, tooLong: 0 };
  if (text.trim() === "") return result;

  const seen = new Set(existing);
  for (const row of text.replace(/(\r?\n)+$/, "").split(/\r?\n/)) {
    const line = row.trim();
    if (line === "") {
      result.skippedEmpty += 1;
    } else if (seen.has(line)) {
      result.skippedDuplicate += 1;
    } else if (line.length > MAX_LINE_LENGTH) {
      result.tooLong += 1;
    } else {
      seen.add(line);
      result.lines.push(line);
    }
  }
  return result;
}
