import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findBannedWords } from "@/lib/copy/banned-words";

import { BUILTIN_SETS, DAILY_VERSE_SET_ID } from "./builtin-lines";

const MIGRATIONS_DIR = join(process.cwd(), "src", "db", "migrations");
const seedFile = readdirSync(MIGRATIONS_DIR).find((name) =>
  name.endsWith("_seed-builtin-daily-sets.sql"),
);
const seedSql = seedFile ? readFileSync(join(MIGRATIONS_DIR, seedFile), "utf8") : "";

const verseFile = readdirSync(MIGRATIONS_DIR).find((name) =>
  name.endsWith("_seed-daily-verse.sql"),
);
const verseSql = verseFile ? readFileSync(join(MIGRATIONS_DIR, verseFile), "utf8") : "";

const escapeSql = (value: string) => value.replaceAll("'", "''");

describe("built-in daily sets", () => {
  it("has the seed migration", () => {
    expect(seedFile).toBeDefined();
  });

  for (const set of BUILTIN_SETS) {
    describe(set.name, () => {
      it("has at least 30 lines", () => {
        expect(set.lines.length).toBeGreaterThanOrEqual(30);
      });

      it("has no duplicate lines", () => {
        expect(new Set(set.lines).size).toBe(set.lines.length);
      });

      it("keeps every line within 1 to 500 characters", () => {
        for (const line of set.lines) {
          expect(line.length).toBeGreaterThanOrEqual(1);
          expect(line.length).toBeLessThanOrEqual(500);
        }
      });

      it("uses no banned words", () => {
        for (const line of set.lines) expect(findBannedWords(line)).toEqual([]);
      });

      it("matches the seed migration", () => {
        expect(seedSql).toContain(`'${set.id}'`);
        expect(seedSql).toContain(`'${escapeSql(set.name)}'`);
        set.lines.forEach((line, position) => {
          expect(seedSql).toContain(`'${set.id}', '${escapeSql(line)}', ${position})`);
        });
      });
    });
  }

  it("keeps exclamation marks out of Encouragement", () => {
    const set = BUILTIN_SETS.find((candidate) => candidate.name === "Encouragement");
    expect(set).toBeDefined();
    for (const line of set?.lines ?? []) expect(line).not.toContain("!");
  });

  it("keeps pressure phrases and emoji out of Encouragement", () => {
    const set = BUILTIN_SETS.find((candidate) => candidate.name === "Encouragement");
    const pattern =
      /\b(on track|keep it up|crush|grind|must|have to|hurry)\b|\p{Extended_Pictographic}/iu;
    for (const line of set?.lines ?? []) expect(line).not.toMatch(pattern);
  });

  describe("Daily Verse seed", () => {
    const rowPattern = /\('[0-9a-f-]+', '((?:[^']|'')*)', (\d+), '(\d{4}-\d{2}-\d{2})'\)/g;
    const rows = [
      ...verseSql
        .split('INSERT INTO "daily_lines"')[1]
        .split("DELETE FROM")[0]
        .matchAll(rowPattern),
    ].map((match) => ({
      text: match[1].replaceAll("''", "'"),
      date: match[3],
    }));

    it("has the seed migration with the set id and name", () => {
      expect(verseFile).toBeDefined();
      expect(verseSql).toContain(`'${DAILY_VERSE_SET_ID}'`);
      expect(verseSql).toContain("'Daily Verse'");
    });

    it("seeds 183 lines", () => {
      expect(rows).toHaveLength(183);
    });

    it("has a unique date per line", () => {
      expect(new Set(rows.map((row) => row.date)).size).toBe(rows.length);
    });

    it("keeps every line within 1 to 500 characters", () => {
      for (const row of rows) {
        expect(row.text.length).toBeGreaterThanOrEqual(1);
        expect(row.text.length).toBeLessThanOrEqual(500);
      }
    });

    it("spans 2026-10-01 to 2027-04-01", () => {
      const dates = rows.map((row) => row.date).sort();
      expect(dates[0]).toBe("2026-10-01");
      expect(dates.at(-1)).toBe("2027-04-01");
    });
  });
});
