export type CommitDecision =
  { kind: "skip" } | { kind: "revert-required" } | { kind: "save"; value: string };

type CommitInput = { draft: string; value: string; required: boolean };

export function decideCommit({ draft, value, required }: CommitInput): CommitDecision {
  const trimmed = draft.trim();
  if (required && trimmed === "") return { kind: "revert-required" };
  if (trimmed === value) return { kind: "skip" };
  return { kind: "save", value: trimmed };
}
