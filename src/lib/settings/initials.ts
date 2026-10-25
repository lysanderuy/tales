export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return (Array.from(first)[0] + (last ? Array.from(last)[0] : "")).toUpperCase();
}
