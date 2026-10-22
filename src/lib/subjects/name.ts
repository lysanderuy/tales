import { messages } from "@/lib/messages";

export type NameError = "empty" | "invalidChar" | "taken";

export function validateName(raw: string, siblingNames: readonly string[]): NameError | null {
  const name = raw.trim();
  if (!name) return "empty";
  if (name.includes(">")) return "invalidChar";
  const lower = name.toLowerCase();
  if (siblingNames.some((sibling) => sibling.toLowerCase() === lower)) return "taken";
  return null;
}

export type WeightResult = { ok: true; value: number | null } | { ok: false };

export function parseWeight(raw: string): WeightResult {
  const text = raw.trim();
  if (text === "") return { ok: true, value: null };
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 100) return { ok: false };
  return { ok: true, value: Math.round(value * 10) / 10 };
}

export function nameErrorMessage(error: NameError): string {
  if (error === "empty") return messages.subjectsEnterName;
  if (error === "invalidChar") return messages.nodeNameInvalidChar;
  return messages.nodeNameTaken;
}
