import { describe, expect, it } from "vitest";

import type { ClockSession } from "./clock";
import { faviconState, quantizeProgress } from "./favicon";

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

const planned: ClockSession = { ...open, plannedMinutes: 25 };

describe("faviconState planned", () => {
  it("starts full and drains as time is spent", () => {
    expect(faviconState(planned, at(0))).toEqual({ progress: 1, tone: "run" });
    expect(faviconState(planned, at(10)).progress).toBeCloseTo(0.6);
    expect(faviconState(planned, at(24, 30)).progress).toBeCloseTo(30 / 1500);
  });

  it("shows a full overtime ring once past the plan", () => {
    expect(faviconState(planned, at(25))).toEqual({ progress: 1, tone: "overtime" });
    expect(faviconState(planned, at(40))).toEqual({ progress: 1, tone: "overtime" });
  });
});

describe("faviconState open", () => {
  it("fills one lap per hour", () => {
    expect(faviconState(open, at(0))).toEqual({ progress: 0.02, tone: "run" });
    expect(faviconState(open, at(15)).progress).toBeCloseTo(0.25);
  });

  it("rolls over at 3600 seconds and stays green", () => {
    expect(faviconState(open, at(60))).toEqual({ progress: 0.02, tone: "run" });
    expect(faviconState(open, at(90))).toEqual({ progress: 0.5, tone: "run" });
  });
});

describe("faviconState paused", () => {
  it("freezes progress and uses the paused tone", () => {
    const pausedOpen: ClockSession = {
      ...open,
      state: "paused",
      pauses: [{ pausedAt: iso(15), resumedAt: null }],
    };
    const pausedPlanned: ClockSession = {
      ...planned,
      state: "paused",
      pauses: [{ pausedAt: iso(10), resumedAt: null }],
    };
    expect(faviconState(pausedOpen, at(30))).toEqual({ progress: 0.25, tone: "paused" });
    const state = faviconState(pausedPlanned, at(30));
    expect(state.tone).toBe("paused");
    expect(state.progress).toBeCloseTo(0.6);
  });

  it("stays gray and full when paused past the plan", () => {
    const pausedOver: ClockSession = {
      ...planned,
      state: "paused",
      pauses: [{ pausedAt: iso(30), resumedAt: null }],
    };
    expect(faviconState(pausedOver, at(45))).toEqual({ progress: 1, tone: "paused" });
  });
});

describe("quantizeProgress", () => {
  it("snaps to the step grid", () => {
    expect(quantizeProgress(0.0149)).toBe(0.02);
    expect(quantizeProgress(0.5, 4)).toBe(0.5);
    expect(quantizeProgress(0.37, 4)).toBe(0.25);
  });

  it("clamps to 0..1", () => {
    expect(quantizeProgress(-1)).toBe(0);
    expect(quantizeProgress(2)).toBe(1);
  });
});
