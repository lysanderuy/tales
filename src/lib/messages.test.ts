import { describe, expect, it } from "vitest";

import { findBannedWords } from "@/lib/copy/banned-words";

import { messages } from "./messages";

const sampleArgs = ["Hematology > Blood grouping", "08:30", "09:45"] as const;

function render(value: (typeof messages)[keyof typeof messages]): string {
  return typeof value === "function" ? value(...sampleArgs) : value;
}

describe("messages", () => {
  it.each(Object.entries(messages))("%s has no banned words", (_key, value) => {
    expect(findBannedWords(render(value))).toEqual([]);
  });

  it("renders function messages with their arguments", () => {
    expect(messages.overlapsWith(...sampleArgs)).toContain("Blood grouping");
  });
});
