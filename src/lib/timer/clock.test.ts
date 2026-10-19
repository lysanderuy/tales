import { describe, expect, it } from "vitest";

import {
  clockDisplay,
  clockOffset,
  formatClock,
  sessionActiveSeconds,
  tabTitle,
  type ClockSession,
} from "./clock";

const START = Date.UTC(2026, 0, 1, 8, 0, 0);
const iso = (minutes: number) => new Date(START + minutes * 60_000).toISOString();
const at = (minutes: number, seconds = 0) => START + minutes * 60_000 + seconds * 1000;

const open: ClockSession = {
  startedAt: iso(0),
  endedAt: null,
  state: "running",
  plannedMinutes: null,
  pauses: [],
};

describe("formatClock", () => {
  it("uses mm:ss under an hour and h:mm:ss from an hour", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(3599)).toBe("59:59");
    expect(formatClock(3600)).toBe("1:00:00");
    expect(formatClock(3725)).toBe("1:02:05");
  });
});

describe("clockOffset", () => {
  it("is the server time minus the client time", () => {
    expect(clockOffset(iso(5), at(0))).toBe(5 * 60_000);
  });

  it("makes a wrong laptop clock irrelevant", () => {
    const clientAtArrival = at(-90);
    const offset = clockOffset(iso(10), clientAtArrival);
    const clientLater = clientAtArrival + 30_000;
    expect(clockDisplay(open, clientLater + offset).text).toBe("10:30");
  });
});

describe("clockDisplay", () => {
  it("counts up for an open timer", () => {
    expect(clockDisplay(open, at(12, 34))).toEqual({ text: "12:34", over: false, paused: false });
  });

  it("excludes finished pauses", () => {
    const session: ClockSession = {
      ...open,
      pauses: [{ pausedAt: iso(10), resumedAt: iso(15) }],
    };
    expect(clockDisplay(session, at(20)).text).toBe("15:00");
  });

  it("freezes while paused", () => {
    const session: ClockSession = {
      ...open,
      state: "paused",
      pauses: [{ pausedAt: iso(10), resumedAt: null }],
    };
    expect(clockDisplay(session, at(10)).text).toBe("10:00");
    expect(clockDisplay(session, at(40))).toEqual({ text: "10:00", over: false, paused: true });
  });

  it("counts down a preset", () => {
    const session: ClockSession = { ...open, plannedMinutes: 25 };
    expect(clockDisplay(session, at(0, 50)).text).toBe("24:10");
  });

  it("switches to overtime after the countdown", () => {
    const session: ClockSession = { ...open, plannedMinutes: 25 };
    expect(clockDisplay(session, at(24, 59))).toEqual({
      text: "00:01",
      over: false,
      paused: false,
    });
    expect(clockDisplay(session, at(25))).toEqual({ text: "+00:00", over: true, paused: false });
    expect(clockDisplay(session, at(28, 12))).toEqual({
      text: "+03:12",
      over: true,
      paused: false,
    });
  });

  it("does not flag overtime while paused", () => {
    const session: ClockSession = {
      ...open,
      state: "paused",
      plannedMinutes: 5,
      pauses: [{ pausedAt: iso(6), resumedAt: null }],
    };
    expect(clockDisplay(session, at(30))).toEqual({ text: "+01:00", over: false, paused: true });
  });

  it("shows hours from one hour", () => {
    expect(clockDisplay(open, at(75, 5)).text).toBe("1:15:05");
  });
});

describe("sessionActiveSeconds", () => {
  it("never goes negative before the start", () => {
    expect(sessionActiveSeconds(open, at(-1))).toBe(0);
  });
});

describe("tabTitle", () => {
  const running = clockDisplay(open, at(12, 34));

  it("is Tales without a timer", () => {
    expect(tabTitle(null, null, "Anatomy")).toBe("Tales");
  });

  it("shows the open timer", () => {
    expect(tabTitle(open, running, "Blood grouping")).toBe("12:34 · Blood grouping");
  });

  it("shows time left for a preset", () => {
    const session = { ...open, plannedMinutes: 25 };
    expect(tabTitle(session, clockDisplay(session, at(0, 50)), "Blood grouping")).toBe(
      "24:10 left · Blood grouping",
    );
  });

  it("shows overtime", () => {
    const session = { ...open, plannedMinutes: 25 };
    expect(tabTitle(session, clockDisplay(session, at(28, 12)), "Blood grouping")).toBe(
      "+03:12 · Blood grouping",
    );
  });

  it("shows paused", () => {
    const paused: ClockSession = {
      ...open,
      state: "paused",
      pauses: [{ pausedAt: iso(5), resumedAt: null }],
    };
    expect(tabTitle(paused, clockDisplay(paused, at(9)), "Blood grouping")).toBe(
      "Paused · Blood grouping",
    );
  });

  it("falls back to Studying without a Subject", () => {
    expect(tabTitle(open, running, null)).toBe("12:34 · Studying");
  });
});
