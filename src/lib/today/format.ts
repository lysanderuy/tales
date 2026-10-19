export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatSeconds(seconds: number): string {
  return formatMinutes(secondsToMinutes(seconds));
}

export function formatProgress(plannedMinutes: number | null, progressSeconds: number): string {
  const done = secondsToMinutes(progressSeconds);
  return plannedMinutes === null ? `${done} min` : `${done} of ${plannedMinutes} min`;
}

export function progressPercent(plannedMinutes: number, progressSeconds: number): number {
  if (plannedMinutes <= 0) return 0;
  return Math.min(100, (progressSeconds / (plannedMinutes * 60)) * 100);
}

export function splitTotal(seconds: number): { hours: number; minutes: number } {
  const total = secondsToMinutes(seconds);
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function formatHoursLabel(seconds: number): string {
  return seconds > 0 ? `${(seconds / 3600).toFixed(1)} h` : "";
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtc(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
}

export function formatDateEyebrow(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const weekday = formatUtc(date, { weekday: "long" });
  const monthDay = formatUtc(date, { month: "short", day: "numeric" });
  return `${weekday} · ${monthDay}`;
}

export function formatDayLabel(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${formatUtc(date, { weekday: "short" })} ${date.getUTCDate()}`;
}

export function formatEventDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${formatUtc(date, { weekday: "short" })} ${formatUtc(date, { month: "short", day: "numeric" })}`;
}

export function formatDaysAway(daysAway: number): string {
  if (daysAway <= 0) return "today";
  return daysAway === 1 ? "in 1 day" : `in ${daysAway} days`;
}

export function formatEventSub(event: {
  date: string;
  time: string | null;
  daysAway: number;
}): string {
  const when = event.time
    ? `${formatEventDate(event.date)}, ${event.time}`
    : formatEventDate(event.date);
  return `${when} · ${formatDaysAway(event.daysAway)}`;
}

export function formatTimeRanges(
  times: ReadonlyArray<{ startClock: string; endClock: string | null }>,
  runningLabel: string,
): string {
  return times.map((t) => `${t.startClock}–${t.endClock ?? runningLabel}`).join(", ");
}
