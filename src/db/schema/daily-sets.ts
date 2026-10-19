import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const dailySets = pgTable(
  "daily_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    builtIn: boolean("built_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("daily_sets_name_check", sql`char_length(${t.name}) between 1 and 60`),
    check("daily_sets_built_in_check", sql`${t.builtIn} = (${t.ownerId} is null)`),
  ],
).enableRLS();

export const dailyLines = pgTable(
  "daily_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    setId: uuid("set_id")
      .notNull()
      .references(() => dailySets.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("daily_lines_set_position_idx").on(t.setId, t.position),
    check("daily_lines_text_check", sql`char_length(${t.text}) between 1 and 500`),
  ],
).enableRLS();

export const dailySetActivation = pgTable(
  "daily_set_activation",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    setId: uuid("set_id")
      .notNull()
      .references(() => dailySets.id, { onDelete: "cascade" }),
    active: boolean("active").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.setId] })],
).enableRLS();

export const hiddenLines = pgTable(
  "hidden_lines",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    lineId: uuid("line_id")
      .notNull()
      .references(() => dailyLines.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lineId] })],
).enableRLS();

export const dailyLinePicks = pgTable(
  "daily_line_picks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    lineId: uuid("line_id")
      .notNull()
      .references(() => dailyLines.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] })],
).enableRLS();

export type DailySet = typeof dailySets.$inferSelect;
export type DailyLine = typeof dailyLines.$inferSelect;
