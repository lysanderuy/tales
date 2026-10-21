import { describe, expect, it } from "vitest";

import { decideHeartbeat } from "./heartbeat";

const MIN = 60_000;
const base = { handled: false, stale: false, lastHeartbeatMs: 0, serverNowMs: 0 };

describe("decideHeartbeat", () => {
  it("sends when the last heartbeat is recent", () => {
    expect(decideHeartbeat({ ...base, serverNowMs: 14 * MIN })).toBe("send");
  });

  it("refetches instead of sending at the threshold", () => {
    expect(decideHeartbeat({ ...base, serverNowMs: 15 * MIN })).toBe("refetch");
    expect(decideHeartbeat({ ...base, serverNowMs: 3 * 60 * MIN })).toBe("refetch");
  });

  it("holds while the prompt is pending", () => {
    expect(decideHeartbeat({ ...base, stale: true, serverNowMs: 20 * MIN })).toBe("hold");
  });

  it("sends once the prompt is handled, whatever the gap", () => {
    expect(decideHeartbeat({ ...base, handled: true, stale: true, serverNowMs: 60 * MIN })).toBe(
      "send",
    );
    expect(decideHeartbeat({ ...base, handled: true, serverNowMs: 60 * MIN })).toBe("send");
  });
});
