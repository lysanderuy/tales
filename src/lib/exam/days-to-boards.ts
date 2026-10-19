export type DaysToBoards =
  { state: "hidden" } | { state: "days"; days: number } | { state: "today" };

const MS_PER_DAY = 86_400_000;

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function daysToBoards(examDateKey: string | null, todayKey: string): DaysToBoards {
  if (examDateKey === null) return { state: "hidden" };
  const days = dayNumber(examDateKey) - dayNumber(todayKey);
  if (days < 0) return { state: "hidden" };
  if (days === 0) return { state: "today" };
  return { state: "days", days };
}
