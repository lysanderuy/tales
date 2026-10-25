import { z } from "zod";

import { MAX_LINE_LENGTH } from "@/lib/daily/pick";

const idSchema = z.string().uuid();

export const dailySetIdParamSchema = idSchema;
export const dailyLineIdParamSchema = idSchema;

const setNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .meta({ description: "Set name, 1 to 60 characters.", example: "My reminders" });

const lineTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_LINE_LENGTH)
  .meta({ description: "Plain text, 1 to 500 characters. Any reference is part of the text." });

export const createDailySetSchema = z.object({ name: setNameSchema });

export type CreateDailySetInput = z.infer<typeof createDailySetSchema>;

export const renameDailySetSchema = z.object({ name: setNameSchema });

export type RenameDailySetInput = z.infer<typeof renameDailySetSchema>;

export const createDailyLineSchema = z.object({ text: lineTextSchema });

export type CreateDailyLineInput = z.infer<typeof createDailyLineSchema>;

export const updateDailyLineSchema = z.object({ text: lineTextSchema });

export type UpdateDailyLineInput = z.infer<typeof updateDailyLineSchema>;

export const bulkDailyLinesSchema = z.object({
  text: z.string().max(200_000).meta({
    description: "The pasted block. One Line per row. Empty rows and duplicates are skipped.",
  }),
  preview: z.boolean().optional().meta({
    description: "When true, nothing is written and the counts show what would happen.",
  }),
});

export type BulkDailyLinesInput = z.infer<typeof bulkDailyLinesSchema>;

export const dailySetResponseSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    builtIn: z.boolean().meta({ description: "Built-in Sets cannot be changed." }),
    active: z.boolean().meta({ description: "True for the one Set Today draws from." }),
    lineCount: z.number().int(),
  })
  .meta({ id: "DailySet", description: "A group of Lines." });

export type DailySetResponse = z.infer<typeof dailySetResponseSchema>;

export const dailyLineResponseSchema = z
  .object({
    id: idSchema,
    setId: idSchema,
    text: z.string(),
    position: z.number().int().meta({ description: "Zero-based place in the Set." }),
    hidden: z.boolean().meta({ description: "True when you have hidden this Line." }),
    readingDate: z
      .string()
      .nullable()
      .meta({ description: "The day this Line is read, or null when it has no fixed day." }),
  })
  .meta({ id: "DailyLine", description: "One Line in a Set." });

export type DailyLineResponse = z.infer<typeof dailyLineResponseSchema>;

export const todaysLineSchema = z
  .object({
    id: idSchema,
    setId: idSchema,
    text: z.string(),
  })
  .nullable()
  .meta({
    id: "TodaysLine",
    description: "The Line for today, or null when no visible Lines are on.",
  });

export type TodaysLine = z.infer<typeof todaysLineSchema>;

export const bulkDailyLinesResponseSchema = z
  .object({
    added: z.number().int().meta({ description: "Lines added, or that would be added." }),
    skippedEmpty: z.number().int(),
    skippedDuplicate: z.number().int(),
    tooLong: z.number().int().meta({ description: "Rows over 500 characters, not added." }),
  })
  .meta({ id: "BulkDailyLinesResult" });

export type BulkDailyLinesResponse = z.infer<typeof bulkDailyLinesResponseSchema>;
