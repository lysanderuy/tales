import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { outlineNodes } from "./outline-nodes";
import { profiles } from "./profiles";

export const methodTagEnum = pgEnum("method_tag", [
  "lecture_notes",
  "personal_notes",
  "flashcards",
  "questions",
]);

export const startedFromEnum = pgEnum("started_from", ["free", "planned", "next_up"]);

export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id"),
    blockId: uuid("block_id"),
    eventId: uuid("event_id"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    plannedMinutes: integer("planned_minutes"),
    methodTag: methodTagEnum("method_tag"),
    methodTags: methodTagEnum("method_tags")
      .array()
      .notNull()
      .default(sql`'{}'::method_tag[]`),
    note: text("note"),
    startedFrom: startedFromEnum("started_from").notNull().default("free"),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("study_sessions_user_id_id_unique").on(t.userId, t.id),
    foreignKey({
      name: "study_sessions_node_fk",
      columns: [t.userId, t.nodeId],
      foreignColumns: [outlineNodes.userId, outlineNodes.id],
    }).onDelete("no action"),
    index("study_sessions_user_node_idx").on(t.userId, t.nodeId),
    index("study_sessions_user_block_idx").on(t.userId, t.blockId),
    index("study_sessions_user_event_idx").on(t.userId, t.eventId),
    uniqueIndex("study_sessions_one_live_per_user")
      .on(t.userId)
      .where(sql`${t.endedAt} is null`),
    index("study_sessions_user_started_idx").on(t.userId, t.startedAt),
    check("study_sessions_ended_after_started_check", sql`${t.endedAt} > ${t.startedAt}`),
    check(
      "study_sessions_planned_minutes_check",
      sql`${t.plannedMinutes} is null or ${t.plannedMinutes} > 0`,
    ),
    check("study_sessions_note_check", sql`${t.note} is null or char_length(${t.note}) <= 5000`),
  ],
).enableRLS();

export const sessionPauses = pgTable(
  "session_pauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").notNull(),
    pausedAt: timestamp("paused_at", { withTimezone: true }).notNull(),
    resumedAt: timestamp("resumed_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      name: "session_pauses_session_fk",
      columns: [t.userId, t.sessionId],
      foreignColumns: [studySessions.userId, studySessions.id],
    }).onDelete("cascade"),
    uniqueIndex("session_pauses_one_open_per_session")
      .on(t.sessionId)
      .where(sql`${t.resumedAt} is null`),
    index("session_pauses_session_idx").on(t.sessionId),
    check("session_pauses_resumed_after_paused_check", sql`${t.resumedAt} > ${t.pausedAt}`),
  ],
).enableRLS();

export type StudySession = typeof studySessions.$inferSelect;
export type SessionPause = typeof sessionPauses.$inferSelect;
