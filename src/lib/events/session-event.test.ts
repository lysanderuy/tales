import { describe, expect, it } from "vitest";

import { resolveSessionEvent } from "./session-event";

describe("resolveSessionEvent", () => {
  it("lets an explicit event win over the block's", () => {
    expect(
      resolveSessionEvent({
        explicit: "e1",
        current: null,
        blockEventId: "e2",
        blockAttached: true,
      }),
    ).toBe("e1");
  });

  it("lets an explicit null clear the event", () => {
    expect(
      resolveSessionEvent({
        explicit: null,
        current: "e1",
        blockEventId: "e2",
        blockAttached: true,
      }),
    ).toBeNull();
  });

  it("inherits the block's event when none is set", () => {
    expect(
      resolveSessionEvent({
        explicit: undefined,
        current: null,
        blockEventId: "e2",
        blockAttached: true,
      }),
    ).toBe("e2");
  });

  it("keeps an existing event", () => {
    expect(
      resolveSessionEvent({
        explicit: undefined,
        current: "e1",
        blockEventId: "e2",
        blockAttached: true,
      }),
    ).toBeUndefined();
  });

  it("leaves the event unchanged without an attached block", () => {
    expect(
      resolveSessionEvent({
        explicit: undefined,
        current: null,
        blockEventId: "e2",
        blockAttached: false,
      }),
    ).toBeUndefined();
  });
});
