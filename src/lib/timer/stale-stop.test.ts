import { describe, expect, it } from "vitest";

import { localTimeValue, staleStopInstant } from "./stale-stop";

const startedAt = new Date(2026, 5, 10, 9, 0, 0, 0);
const heartbeat = new Date(2026, 5, 10, 13, 20, 45, 123);
const now = new Date(2026, 5, 10, 18, 0, 0, 0);

describe("staleStopInstant", () => {
  it("builds the instant on the heartbeat's local day with seconds and ms zeroed", () => {
    expect(staleStopInstant("13:20", heartbeat, startedAt, now)).toEqual(
      new Date(2026, 5, 10, 13, 20, 0, 0),
    );
  });

  it("rejects a time before the start", () => {
    expect(staleStopInstant("08:59", heartbeat, startedAt, now)).toBeNull();
  });

  it("accepts the start and now exactly", () => {
    expect(staleStopInstant("09:00", heartbeat, startedAt, now)).not.toBeNull();
    expect(staleStopInstant("18:00", heartbeat, startedAt, now)).not.toBeNull();
  });

  it("rejects a time in the future", () => {
    expect(staleStopInstant("18:01", heartbeat, startedAt, now)).toBeNull();
  });

  it("uses the heartbeat's day when it was the previous day", () => {
    const lateStart = new Date(2026, 5, 9, 22, 0, 0, 0);
    const lateHeartbeat = new Date(2026, 5, 9, 23, 10, 0, 0);
    const later = new Date(2026, 5, 10, 8, 0, 0, 0);
    expect(staleStopInstant("23:30", lateHeartbeat, lateStart, later)).toEqual(
      new Date(2026, 5, 9, 23, 30, 0, 0),
    );
    expect(staleStopInstant("21:00", lateHeartbeat, lateStart, later)).toBeNull();
  });

  it("rejects malformed values", () => {
    expect(staleStopInstant("", heartbeat, startedAt, now)).toBeNull();
    expect(staleStopInstant("25:00", heartbeat, startedAt, now)).toBeNull();
    expect(staleStopInstant("12:60", heartbeat, startedAt, now)).toBeNull();
    expect(staleStopInstant("1:20", heartbeat, startedAt, now)).toBeNull();
  });

  it("round-trips with localTimeValue", () => {
    expect(localTimeValue(heartbeat)).toBe("13:20");
    expect(localTimeValue(new Date(2026, 5, 10, 7, 5))).toBe("07:05");
  });
});
