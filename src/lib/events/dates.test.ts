import { describe, expect, it } from "vitest";

import { formatEventLine, formatEventMeta, formatShortDate, relativeDay } from "./dates";

const today = "2026-03-02";

describe("relativeDay", () => {
  it("names today and tomorrow", () => {
    expect(relativeDay("2026-03-02", today)).toBe("today");
    expect(relativeDay("2026-03-03", today)).toBe("tomorrow");
  });

  it("counts days ahead", () => {
    expect(relativeDay("2026-03-11", today)).toBe("in 9 days");
  });

  it("has nothing to say about the past", () => {
    expect(relativeDay("2026-03-01", today)).toBeNull();
  });
});

describe("formatShortDate", () => {
  it("omits the year within the current year", () => {
    expect(formatShortDate("2026-04-05", today)).toBe("Apr 5");
  });

  it("adds the year otherwise", () => {
    expect(formatShortDate("2027-01-09", today)).toBe("Jan 9, 2027");
  });
});

describe("formatEventMeta", () => {
  it("joins date and time", () => {
    expect(formatEventMeta("2026-03-11", "09:00", today)).toBe("Mar 11 · 09:00");
    expect(formatEventMeta("2026-03-11", null, today)).toBe("Mar 11");
  });
});

describe("formatEventLine", () => {
  it("adds the relative day for upcoming events", () => {
    expect(formatEventLine({ date: "2026-03-11", time: "09:00", upcoming: true }, today)).toBe(
      "Wed, Mar 11 · 09:00 · in 9 days",
    );
  });

  it("leaves it off for past events", () => {
    expect(formatEventLine({ date: "2026-02-20", time: null, upcoming: false }, today)).toBe(
      "Fri, Feb 20",
    );
  });
});
