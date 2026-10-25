import { sql } from "drizzle-orm";
import { boolean, check, date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    school: text("school"),
    reviewCenter: text("review_center"),
    examDate: date("exam_date", { mode: "string" }),
    timeZone: text("time_zone").notNull().default("Asia/Manila"),
    soundOn: boolean("sound_on").notNull().default(true),
    theme: text("theme").notNull().default("light"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check("profiles_theme_check", sql`${table.theme} in ('light', 'dark')`)],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
