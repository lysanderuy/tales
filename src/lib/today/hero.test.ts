import { describe, expect, it } from "vitest";

import { decideHero } from "./hero";

const event = { title: "Mock board 1" };
const line = { text: "Small, steady hours add up." };

describe("decideHero", () => {
  it("hides the hero when there is nothing to show", () => {
    expect(
      decideHero({ daysToBoards: { state: "hidden" }, dailyLine: null, nextEvent: null }).visible,
    ).toBe(false);
  });

  it("puts the Daily Line below the count when days are shown", () => {
    expect(
      decideHero({ daysToBoards: { state: "days", days: 133 }, dailyLine: line, nextEvent: event }),
    ).toEqual({
      visible: true,
      boards: { kind: "days", days: 133 },
      lead: null,
      line: line.text,
      event,
    });
  });

  it("leads with the Daily Line when days are hidden", () => {
    const hero = decideHero({
      daysToBoards: { state: "hidden" },
      dailyLine: line,
      nextEvent: null,
    });
    expect(hero.lead).toBe(line.text);
    expect(hero.line).toBeNull();
    expect(hero.boards).toBeNull();
  });

  it("shows only the event when it is all there is", () => {
    const hero = decideHero({
      daysToBoards: { state: "hidden" },
      dailyLine: null,
      nextEvent: event,
    });
    expect(hero.visible).toBe(true);
    expect(hero.lead).toBeNull();
  });

  it("handles exam day", () => {
    expect(
      decideHero({ daysToBoards: { state: "today" }, dailyLine: null, nextEvent: null }).boards,
    ).toEqual({ kind: "today" });
  });
});
