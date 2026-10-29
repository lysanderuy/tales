import { describe, expect, it } from "vitest";

import { formatLogWhen } from "./log";

const labels = { today: "Today", yesterday: "Yesterday" };
const now = new Date("2026-03-10T04:00:00Z");

describe("formatLogWhen", () => {
  it("uses the profile time zone for the day and clock", () => {
    const text = formatLogWhen(
      "2026-03-09T17:30:00Z",
      "2026-03-09T18:15:00Z",
      "Asia/Manila",
      now,
      labels,
    );
    expect(text).toBe("1:30–2:15am · Today");
  });

  it("labels the previous local day", () => {
    const text = formatLogWhen(
      "2026-03-09T01:00:00Z",
      "2026-03-09T02:00:00Z",
      "Asia/Manila",
      now,
      labels,
    );
    expect(text).toBe("9:00–10:00am · Yesterday");
  });

  it("falls back to a short date for older days", () => {
    const text = formatLogWhen(
      "2026-03-02T01:00:00Z",
      "2026-03-02T02:00:00Z",
      "Asia/Manila",
      now,
      labels,
    );
    expect(text).toBe("9:00–10:00am · Mon Mar 2");
  });
});
