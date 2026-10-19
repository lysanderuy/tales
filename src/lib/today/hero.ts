export type DaysToBoardsInput =
  { state: "hidden" } | { state: "days"; days: number } | { state: "today" };

export interface HeroInput<E> {
  daysToBoards: DaysToBoardsInput;
  dailyLine: { text: string } | null;
  nextEvent: E | null;
}

export interface HeroState<E> {
  visible: boolean;
  boards: { kind: "days"; days: number } | { kind: "today" } | null;
  lead: string | null;
  line: string | null;
  event: E | null;
}

export function decideHero<E>(input: HeroInput<E>): HeroState<E> {
  const boards =
    input.daysToBoards.state === "days"
      ? ({ kind: "days", days: input.daysToBoards.days } as const)
      : input.daysToBoards.state === "today"
        ? ({ kind: "today" } as const)
        : null;
  const text = input.dailyLine?.text ?? null;

  return {
    visible: boards !== null || text !== null || input.nextEvent !== null,
    boards,
    lead: boards ? null : text,
    line: boards ? text : null,
    event: input.nextEvent,
  };
}
