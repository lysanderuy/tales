import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { outlineNodes } from "./outline-nodes";
import { profiles } from "./profiles";

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("templates_user_id_id_unique").on(t.userId, t.id),
    check("templates_name_check", sql`char_length(${t.name}) between 1 and 60`),
  ],
).enableRLS();

export const templateItems = pgTable(
  "template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").notNull(),
    nodeId: uuid("node_id").notNull(),
    timeOfDay: time("time_of_day"),
    plannedMinutes: integer("planned_minutes"),
    position: integer("position").notNull(),
  },
  (t) => [
    unique("template_items_user_id_id_unique").on(t.userId, t.id),
    foreignKey({
      name: "template_items_template_fk",
      columns: [t.userId, t.templateId],
      foreignColumns: [templates.userId, templates.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "template_items_node_fk",
      columns: [t.userId, t.nodeId],
      foreignColumns: [outlineNodes.userId, outlineNodes.id],
    }).onDelete("cascade"),
    index("template_items_template_position_idx").on(t.templateId, t.position),
    index("template_items_node_idx").on(t.nodeId),
    check(
      "template_items_planned_minutes_check",
      sql`${t.plannedMinutes} is null or ${t.plannedMinutes} between 1 and 720`,
    ),
  ],
).enableRLS();

export type Template = typeof templates.$inferSelect;
export type TemplateItem = typeof templateItems.$inferSelect;
