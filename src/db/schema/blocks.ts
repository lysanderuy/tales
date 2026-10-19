import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { outlineNodes } from "./outline-nodes";
import { profiles } from "./profiles";

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    timeOfDay: time("time_of_day"),
    plannedMinutes: integer("planned_minutes"),
    position: integer("position").notNull(),
    eventId: uuid("event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("blocks_user_id_id_unique").on(t.userId, t.id),
    foreignKey({
      name: "blocks_node_fk",
      columns: [t.userId, t.nodeId],
      foreignColumns: [outlineNodes.userId, outlineNodes.id],
    }).onDelete("no action"),
    index("blocks_user_node_idx").on(t.userId, t.nodeId),
    index("blocks_user_date_position_idx").on(t.userId, t.date, t.position),
    check(
      "blocks_planned_minutes_check",
      sql`${t.plannedMinutes} is null or ${t.plannedMinutes} between 1 and 720`,
    ),
  ],
).enableRLS();

export type Block = typeof blocks.$inferSelect;
