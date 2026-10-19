import { describe, expect, it } from "vitest";

import { countdownKey, shouldChime } from "./chime";

const key = countdownKey("s1", 25);

describe("shouldChime", () => {
  it("fires when a running countdown crosses zero", () => {
    expect(shouldChime({ key, over: false }, { key, over: true })).toBe(true);
  });

  it("does not fire on the first sample, even if already overtime", () => {
    expect(shouldChime(null, { key, over: true })).toBe(false);
    expect(shouldChime(null, { key, over: false })).toBe(false);
  });

  it("does not repeat while overtime continues", () => {
    expect(shouldChime({ key, over: true }, { key, over: true })).toBe(false);
  });

  it("does not fire while the countdown is still running", () => {
    expect(shouldChime({ key, over: false }, { key, over: false })).toBe(false);
  });

  it("does not fire when the sample is lost, as when paused", () => {
    expect(shouldChime({ key, over: false }, null)).toBe(false);
  });

  it("treats an extension as a new countdown that can chime again", () => {
    const extended = countdownKey("s1", 50);
    expect(shouldChime({ key, over: true }, { key: extended, over: false })).toBe(false);
    expect(shouldChime({ key: extended, over: false }, { key: extended, over: true })).toBe(true);
  });

  it("does not fire across different sessions", () => {
    expect(shouldChime({ key, over: false }, { key: countdownKey("s2", 25), over: true })).toBe(
      false,
    );
  });
});
