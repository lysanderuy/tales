import { describe, expect, it } from "vitest";

import { staleClockLabel, staleDayLabel, staleStopInstant } from "./stale-stop";

const MANILA = "Asia/Manila";
const NEW_YORK = "America/New_York";

describe("staleStopInstant", () => {
  const startedAt = new Date("2026-06-10T01:00:00Z"); // 09:00 Manila
  const heartbeat = new Date("2026-06-10T05:20:45.123Z"); // 13:20 Manila
  const now = new Date("2026-06-10T10:00:00Z"); // 18:00 Manila

  it("builds the instant on the heartbeat's day in the zone with seconds and ms zeroed", () => {
    expect(staleStopInstant("13:20", heartbeat, startedAt, now, MANILA)).toEqual(
      new Date("2026-06-10T05:20:00.000Z"),
    );
  });

  it("rejects a time before the start", () => {
    expect(staleStopInstant("08:59", heartbeat, startedAt, now, MANILA)).toBeNull();
  });

  it("accepts the start and now exactly", () => {
    expect(staleStopInstant("09:00", heartbeat, startedAt, now, MANILA)).not.toBeNull();
    expect(staleStopInstant("18:00", heartbeat, startedAt, now, MANILA)).not.toBeNull();
  });

  it("rejects a time in the future", () => {
    expect(staleStopInstant("18:01", heartbeat, startedAt, now, MANILA)).toBeNull();
  });

  it("rejects malformed values", () => {
    expect(staleStopInstant("", heartbeat, startedAt, now, MANILA)).toBeNull();
    expect(staleStopInstant("25:00", heartbeat, startedAt, now, MANILA)).toBeNull();
    expect(staleStopInstant("12:60", heartbeat, startedAt, now, MANILA)).toBeNull();
    expect(staleStopInstant("1:20", heartbeat, startedAt, now, MANILA)).toBeNull();
  });

  it("uses the heartbeat's zone day when it differs from the UTC date", () => {
    const lateStart = new Date("2026-06-09T22:00:00Z"); // 06:00 Jun 10 Manila
    const lateHeartbeat = new Date("2026-06-09T23:30:00Z"); // 07:30 Jun 10 Manila
    const later = new Date("2026-06-10T04:00:00Z");
    expect(staleStopInstant("07:45", lateHeartbeat, lateStart, later, MANILA)).toEqual(
      new Date("2026-06-09T23:45:00.000Z"),
    );
    expect(staleStopInstant("05:00", lateHeartbeat, lateStart, later, MANILA)).toBeNull();
  });

  it("uses the previous zone day west of UTC", () => {
    const start = new Date("2026-06-10T23:00:00Z"); // 19:00 Jun 10 New York
    const hb = new Date("2026-06-11T01:30:00Z"); // 21:30 Jun 10 New York
    const later = new Date("2026-06-11T12:00:00Z");
    expect(staleStopInstant("22:00", hb, start, later, NEW_YORK)).toEqual(
      new Date("2026-06-11T02:00:00.000Z"),
    );
    expect(staleStopInstant("18:00", hb, start, later, NEW_YORK)).toBeNull();
  });

  it("resolves just before and just after local midnight on the heartbeat's day", () => {
    const start = new Date("2026-06-10T15:00:00Z"); // 23:00 Jun 10 Manila
    const hb = new Date("2026-06-10T15:30:00Z"); // 23:30 Jun 10 Manila
    const later = new Date("2026-06-11T02:00:00Z");
    expect(staleStopInstant("23:59", hb, start, later, MANILA)).toEqual(
      new Date("2026-06-10T15:59:00.000Z"),
    );
    expect(staleStopInstant("00:01", hb, start, later, MANILA)).toBeNull();
  });
});

describe("staleDayLabel and staleClockLabel", () => {
  const now = new Date("2026-06-10T10:00:00Z"); // 18:00 Jun 10 Manila

  it("shows only the time on the same day in the zone", () => {
    const startedAt = new Date("2026-06-10T01:00:00Z");
    expect(staleDayLabel(startedAt, now, MANILA)).toBeNull();
    expect(staleClockLabel(startedAt, now, MANILA)).toBe("9:00am");
  });

  it("prefixes a short day label on a previous day", () => {
    const earlier = new Date("2026-06-09T13:40:00Z"); // 21:40 Jun 9 Manila
    expect(staleDayLabel(earlier, now, MANILA)).toBe("Tue 9");
    expect(staleClockLabel(earlier, now, MANILA)).toBe("Tue 9 9:40pm");
  });

  it("compares days in the zone, not in UTC", () => {
    const utcSameDay = new Date("2026-06-10T00:30:00Z"); // 08:30 Jun 10 Manila, 20:30 Jun 9 New York
    expect(staleClockLabel(utcSameDay, now, MANILA)).toBe("8:30am");
    expect(staleClockLabel(utcSameDay, now, NEW_YORK)).toBe("Tue 9 8:30pm");
  });

  it("splits at local midnight in the zone", () => {
    const morning = new Date("2026-06-09T16:05:00Z"); // 00:05 Jun 10 Manila
    const justBefore = new Date("2026-06-09T15:59:00Z"); // 23:59 Jun 9 Manila
    const justAfter = new Date("2026-06-09T16:01:00Z"); // 00:01 Jun 10 Manila
    expect(staleClockLabel(justBefore, morning, MANILA)).toBe("Tue 9 11:59pm");
    expect(staleClockLabel(justAfter, morning, MANILA)).toBe("12:01am");
  });
});
