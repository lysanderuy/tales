import { describe, expect, it } from "vitest";

import { daysToBoards } from "./days-to-boards";

describe("daysToBoards", () => {
  it("is hidden when no date is set", () => {
    expect(daysToBoards(null, "2026-10-19")).toEqual({ state: "hidden" });
  });
  it("counts whole days before the exam", () => {
    expect(daysToBoards("2027-03-15", "2027-03-14")).toEqual({ state: "days", days: 1 });
    expect(daysToBoards("2027-01-01", "2026-10-19")).toEqual({ state: "days", days: 74 });
  });
  it("counts across a leap day", () => {
    expect(daysToBoards("2028-03-01", "2028-02-28")).toEqual({ state: "days", days: 2 });
  });
  it("says today on the exam date", () => {
    expect(daysToBoards("2027-03-15", "2027-03-15")).toEqual({ state: "today" });
  });
  it("is hidden after the exam date", () => {
    expect(daysToBoards("2027-03-15", "2027-03-16")).toEqual({ state: "hidden" });
  });
});
