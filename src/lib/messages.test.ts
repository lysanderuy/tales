import { describe, expect, it } from "vitest";

import { findBannedWords } from "@/lib/copy/banned-words";

import { messages } from "./messages";

const sampleArgs = ["Hematology > Blood grouping", "08:30", "09:45"] as const;

function render(value: (typeof messages)[keyof typeof messages]): string {
  return typeof value === "function" ? value(...sampleArgs) : value;
}

// The Events wording was chosen deliberately; "done" is allowed there, and where it shows on plan, and nowhere else.
const ALLOWED_DONE = new Set(["eventsNotMarked", "eventsMarkDone", "planEventDone"]);

describe("messages", () => {
  it.each(Object.entries(messages))("%s has no banned words", (key, value) => {
    const found = findBannedWords(render(value));
    expect(ALLOWED_DONE.has(key) ? found.filter((word) => word !== "done") : found).toEqual([]);
  });

  it("renders function messages with their arguments", () => {
    expect(messages.overlapsWith(...sampleArgs)).toContain("Blood grouping");
  });
});
