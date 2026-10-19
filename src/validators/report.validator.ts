import { z } from "zod";

import { messages } from "@/lib/messages";

const idSchema = z.string().uuid();

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
    },
    { message: messages.invalidRequest },
  )
  .meta({ description: "Local calendar day, YYYY-MM-DD.", example: "2026-01-15" });

const MAX_CUSTOM_DAYS = 3660;

export const reportQuerySchema = z
  .object({
    range: z
      .enum(["last7", "last30", "thisWeek", "custom", "all"])
      .default("last7")
      .meta({ description: "Which days to look at. Defaults to last7.", example: "last7" }),
    from: dateKeySchema.optional().meta({ description: "First day. Only with range=custom." }),
    to: dateKeySchema.optional().meta({ description: "Last day. Only with range=custom." }),
    nodeId: idSchema
      .optional()
      .meta({ description: "Show the Topics under this Subject or Topic instead of Subjects." }),
  })
  .refine(
    (value) =>
      value.range === "custom"
        ? value.from !== undefined &&
          value.to !== undefined &&
          value.from <= value.to &&
          (Date.parse(value.to) - Date.parse(value.from)) / 86_400_000 < MAX_CUSTOM_DAYS
        : value.from === undefined && value.to === undefined,
    { message: messages.invalidRequest },
  );

export type ReportQuery = z.infer<typeof reportQuerySchema>;

const secondsSchema = z.number().meta({ description: "Time studied, not counting pauses." });

export const reportResponseSchema = z
  .object({
    fromDate: dateKeySchema,
    toDate: dateKeySchema,
    totalSeconds: secondsSchema,
    items: z.array(
      z.object({
        nodeId: idSchema.meta({
          description:
            "Subject or Topic ID. When drilled in, the requested item's own ID means time recorded directly on it.",
        }),
        seconds: secondsSchema,
        share: z.number().min(0).max(1).meta({ description: "Fraction of totalSeconds, 0 to 1." }),
        archived: z.boolean(),
      }),
    ),
    days: z
      .array(
        z.object({
          date: dateKeySchema,
          items: z.array(z.object({ nodeId: idSchema, seconds: secondsSchema })),
        }),
      )
      .meta({ description: "Every day in the range, oldest first, including empty days." }),
    noTimeYet: z
      .array(z.object({ nodeId: idSchema, archived: z.boolean() }))
      .meta({ description: "Subjects, or the Topics when drilled in, with no time in the range." }),
  })
  .meta({ id: "Report" });

export type ReportResponse = z.infer<typeof reportResponseSchema>;
