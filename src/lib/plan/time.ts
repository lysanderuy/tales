export type ParsedTime = { ok: true; value: string | null } | { ok: false };

const TIME = /^(\d{1,2}):?(\d{2})?\s*(?:([ap])\.?(?:m\.?)?)?$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

const DAY_MINUTES = 24 * 60;

export function formatTimeOfDay(clock: string): string {
  const [hours = "0", minutes = "00"] = clock.split(":");
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes}${hour < 12 ? "am" : "pm"}`;
}

function toMinutes(clock: string): number {
  const [hours = "0", minutes = "0"] = clock.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function endOfSpan(start: string, minutes: number): { clock: string; nextDay: boolean } {
  const total = toMinutes(start) + minutes;
  const wrapped = total % DAY_MINUTES;
  return {
    clock: `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`,
    nextDay: total >= DAY_MINUTES,
  };
}

export function minutesBetween(start: string, end: string): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff > 0 ? diff : diff + DAY_MINUTES;
}

export function formatClockRange(start: string, end: string | null, running?: string): string {
  const from = formatTimeOfDay(start);
  if (end === null) return running === undefined ? from : `${from}–${running}`;
  const to = formatTimeOfDay(end);
  return from.endsWith(to.slice(-2)) ? `${from.slice(0, -2)}–${to}` : `${from}–${to}`;
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
