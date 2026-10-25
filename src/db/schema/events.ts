import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { outlineNodes } from "./outline-nodes";
import { profiles } from "./profiles";

export const eventType = pgEnum("event_type", [
  "mock_board",
  "preboard",
  "subject_exam",
  "review_center_exam",
]);

export const eventMark = pgEnum("event_mark", ["confident", "review_again"]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: eventType("type"),
    date: date("date", { mode: "string" }).notNull(),
    time: time("time"),
    note: text("note"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("events_user_id_id_unique").on(t.userId, t.id),
    index("events_user_date_idx").on(t.userId, t.date),
    check("events_title_check", sql`char_length(${t.title}) between 1 and 100`),
    check("events_note_check", sql`${t.note} is null or char_length(${t.note}) <= 5000`),
  ],
).enableRLS();

export const eventCovers = pgTable(
  "event_covers",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull(),
    nodeId: uuid("node_id").notNull(),
  },
  (t) => [
    primaryKey({ name: "event_covers_pk", columns: [t.eventId, t.nodeId] }),
    index("event_covers_node_idx").on(t.nodeId),
    foreignKey({
      name: "event_covers_event_fk",
      columns: [t.userId, t.eventId],
      foreignColumns: [events.userId, events.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "event_covers_node_fk",
      columns: [t.userId, t.nodeId],
      foreignColumns: [outlineNodes.userId, outlineNodes.id],
    }).onDelete("cascade"),
  ],
).enableRLS();

export const eventMarks = pgTable(
  "event_marks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").notNull(),
    nodeId: uuid("node_id").notNull(),
    mark: eventMark("mark").notNull(),
  },
  (t) => [
    primaryKey({ name: "event_marks_pk", columns: [t.eventId, t.nodeId] }),
    index("event_marks_node_idx").on(t.nodeId),
    foreignKey({
      name: "event_marks_event_fk",
      columns: [t.userId, t.eventId],
      foreignColumns: [events.userId, events.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "event_marks_node_fk",
      columns: [t.userId, t.nodeId],
      foreignColumns: [outlineNodes.userId, outlineNodes.id],
    }).onDelete("cascade"),
  ],
).enableRLS();

export type Event = typeof events.$inferSelect;
export type EventType = (typeof eventType.enumValues)[number];
export type EventMarkValue = (typeof eventMark.enumValues)[number];
