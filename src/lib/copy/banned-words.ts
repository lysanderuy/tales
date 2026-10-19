const BANNED_WORDS = [
  "session",
  "sessions",
  "link",
  "links",
  "linked",
  "block",
  "blocks",
  "complete",
  "completed",
  "completes",
  "done",
  "late",
  "missed",
  "behind",
  "goal",
  "goals",
  "target",
  "targets",
  "pace",
  "score",
  "scores",
  "grade",
  "grades",
  "syllabus",
  "outline",
  "outlines",
  "blueprint",
  "node",
  "nodes",
  "json",
  "streak",
  "streaks",
  "overdue",
  "failed",
  "unfinished",
] as const;

const BANNED_PATTERN = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])(?:${BANNED_WORDS.join("|")})(?![\p{L}\p{N}_])`,
  "giu",
);

export function findBannedWords(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(BANNED_PATTERN)) found.add(match[0].toLowerCase());
  return [...found];
}
