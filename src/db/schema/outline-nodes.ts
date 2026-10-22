import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const outlineNodes = pgTable(
  "outline_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    examWeight: numeric("exam_weight", { precision: 4, scale: 1 }),
    archived: boolean("archived").notNull().default(false),
    colorIndex: smallint("color_index"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("outline_nodes_user_id_id_unique").on(t.userId, t.id),
    foreignKey({
      name: "outline_nodes_parent_fk",
      columns: [t.userId, t.parentId],
      foreignColumns: [t.userId, t.id],
    }).onDelete("cascade"),
    uniqueIndex("outline_nodes_sibling_name_unique").on(
      t.userId,
      sql`coalesce(${t.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      sql`lower(${t.name})`,
    ),
    index("outline_nodes_user_parent_position_idx").on(t.userId, t.parentId, t.position),
    check(
      "outline_nodes_name_check",
      sql`char_length(${t.name}) between 1 and 200 and position('>' in ${t.name}) = 0`,
    ),
    check(
      "outline_nodes_exam_weight_check",
      sql`${t.examWeight} is null or ${t.examWeight} between 0 and 100`,
    ),
    check(
      "outline_nodes_color_index_check",
      sql`${t.colorIndex} is null or ${t.colorIndex} between 0 and 7`,
    ),
  ],
).enableRLS();

export type OutlineNode = typeof outlineNodes.$inferSelect;
export type NewOutlineNode = typeof outlineNodes.$inferInsert;
