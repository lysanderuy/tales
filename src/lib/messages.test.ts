import { describe, expect, it } from "vitest";

import { findBannedWords } from "@/lib/copy/banned-words";

import { messages } from "./messages";

describe("messages", () => {
  it.each(Object.entries(messages))("%s has no banned words", (_key, value) => {
    expect(findBannedWords(value)).toEqual([]);
  });
});
