import { describe, expect, it } from "vitest";

import {
  activeSeconds,
  clampStopTime,
  extendedPlannedMinutes,
  isStale,
  overtimeSeconds,
  remainingSeconds,
  timerState,
  truncatePauses,
} from "./timer";

const t = (minutes: number) => new Date(Date.UTC(2026, 0, 1, 8, 0, 0) + minutes * 60_000);

describe("activeSeconds", () => {
  it("counts the whole span with no pauses", () => {
    expect(activeSeconds({ startedAt: t(0), endedAt: null, pauses: [] }, t(10))).toBe(600);
  });

  it("subtracts closed pauses", () => {
    const record = {
      startedAt: t(0),
      endedAt: t(30),
      pauses: [{ pausedAt: t(10), resumedAt: t(15) }],
    };
    expect(activeSeconds(record, t(99))).toBe(25 * 60);
  });

  it("runs an open pause to now while live", () => {
    const record = {
      startedAt: t(0),
      endedAt: null,
      pauses: [{ pausedAt: t(10), resumedAt: null }],
    };
    expect(activeSeconds(record, t(20))).toBe(600);
    expect(activeSeconds(record, t(40))).toBe(600);
  });

  it("runs an open pause to endedAt when stopped while paused", () => {
    const record = {
      startedAt: t(0),
      endedAt: t(20),
      pauses: [{ pausedAt: t(10), resumedAt: null }],
    };
    expect(activeSeconds(record, t(500))).toBe(600);
  });

  it("is the same for the same inputs regardless of when it is asked", () => {
    const record = {
      startedAt: t(0),
      endedAt: t(20),
      pauses: [{ pausedAt: t(5), resumedAt: t(8) }],
    };
    expect(activeSeconds(record, t(21))).toBe(activeSeconds(record, t(5000)));
  });

  it("never goes negative", () => {
    expect(activeSeconds({ startedAt: t(10), endedAt: null, pauses: [] }, t(5))).toBe(0);
    const overlapping = {
      startedAt: t(0),
      endedAt: t(10),
      pauses: [
        { pausedAt: t(0), resumedAt: t(10) },
        { pausedAt: t(2), resumedAt: t(8) },
      ],
    };
    expect(activeSeconds(overlapping, t(10))).toBe(0);
  });
});

describe("timerState", () => {
  it("is stopped when ended", () => {
    expect(timerState({ endedAt: t(1), pauses: [{ pausedAt: t(0), resumedAt: null }] })).toBe(
      "stopped",
    );
  });
  it("is paused with an open pause", () => {
    expect(timerState({ endedAt: null, pauses: [{ pausedAt: t(0), resumedAt: null }] })).toBe(
      "paused",
    );
  });
  it("is running otherwise", () => {
    expect(timerState({ endedAt: null, pauses: [{ pausedAt: t(0), resumedAt: t(1) }] })).toBe(
      "running",
    );
  });
});

describe("countdown", () => {
  it("counts down then into overtime", () => {
    expect(remainingSeconds(25, 600)).toBe(900);
    expect(overtimeSeconds(25, 600)).toBe(0);
    expect(remainingSeconds(25, 1500 + 192)).toBe(0);
    expect(overtimeSeconds(25, 1500 + 192)).toBe(192);
  });

  it("extends from the active time so far, rounded up", () => {
    expect(extendedPlannedMinutes(1500 + 192, 25)).toBe(54);
    expect(extendedPlannedMinutes(600, 25)).toBe(35);
    const planned = extendedPlannedMinutes(600, 25);
    expect(remainingSeconds(planned, 600)).toBe(25 * 60);
  });
});

describe("isStale", () => {
  it("is not stale at exactly 15 minutes", () => {
    expect(isStale(t(0), t(15))).toBe(false);
  });
  it("is stale past 15 minutes", () => {
    expect(isStale(t(0), new Date(t(15).getTime() + 1))).toBe(true);
  });
  it("honours a custom threshold", () => {
    expect(isStale(t(0), t(6), 5)).toBe(true);
  });
});

describe("clampStopTime", () => {
  it("accepts times within range, inclusive", () => {
    expect(clampStopTime(t(5), t(0), t(10))).toEqual(t(5));
    expect(clampStopTime(t(0), t(0), t(10))).toEqual(t(0));
    expect(clampStopTime(t(10), t(0), t(10))).toEqual(t(10));
  });
  it("rejects before start, after now and invalid dates", () => {
    expect(clampStopTime(t(-1), t(0), t(10))).toBeNull();
    expect(clampStopTime(t(11), t(0), t(10))).toBeNull();
    expect(clampStopTime(new Date("nope"), t(0), t(10))).toBeNull();
  });
});

describe("truncatePauses", () => {
  it("drops pauses at or after the end", () => {
    const pauses = [
      { pausedAt: t(10), resumedAt: t(12) },
      { pausedAt: t(20), resumedAt: null },
    ];
    expect(truncatePauses(pauses, t(10))).toEqual([]);
  });

  it("closes a pause spanning the end", () => {
    const pauses = [
      { pausedAt: t(2), resumedAt: t(4) },
      { pausedAt: t(8), resumedAt: t(20) },
      { pausedAt: t(9), resumedAt: null },
    ];
    expect(truncatePauses(pauses, t(10))).toEqual([
      { pausedAt: t(2), resumedAt: t(4) },
      { pausedAt: t(8), resumedAt: t(10) },
      { pausedAt: t(9), resumedAt: t(10) },
    ]);
  });
});
