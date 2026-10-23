export type ParsedTime = { ok: true; value: string | null } | { ok: false };

const TIME = /^(\d{1,2}):?(\d{2})?\s*(?:([ap])\.?(?:m\.?)?)?$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseTimeOfDay(raw: string): ParsedTime {
  const text = raw.trim().toLowerCase();
  if (text === "") return { ok: true, value: null };
  const match = TIME.exec(text);
  if (!match) return { ok: false };

  let hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  const meridiem = match[3];
  if (minutes > 59) return { ok: false };

  if (meridiem) {
    if (hours < 1 || hours > 12) return { ok: false };
    hours = (hours % 12) + (meridiem === "p" ? 12 : 0);
  } else if (hours > 23) {
    return { ok: false };
  }
  return { ok: true, value: `${pad(hours)}:${pad(minutes)}` };
}
