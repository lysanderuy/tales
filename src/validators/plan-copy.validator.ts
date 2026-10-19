import { z } from "zod";

import { messages } from "@/lib/messages";

export const dateKeySchema = z
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

const previewSchema = z.boolean().optional().meta({
  description: "When true, nothing is written and added is the count the action would add.",
});

export const copyDaySchema = z.object({
  sourceDate: dateKeySchema.meta({ description: "The day to copy planned items from." }),
  targetDates: z
    .array(dateKeySchema)
    .min(1)
    .max(60)
    .transform((dates) => [...new Set(dates)])
    .meta({ description: "Days to copy onto, 1 to 60. Repeats are ignored." }),
  preview: previewSchema,
});

export type CopyDayInput = z.infer<typeof copyDaySchema>;

export const repeatDaySchema = z
  .object({
    sourceDate: dateKeySchema.meta({ description: "The day to repeat planned items from." }),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1)
      .max(7)
      .transform((days) => [...new Set(days)].sort((a, b) => a - b))
      .meta({ description: "Days of the week, 1 = Monday to 7 = Sunday.", example: [1, 3, 5] }),
    endDate: dateKeySchema.meta({
      description: "Last day to repeat onto. Repeat starts the day after sourceDate.",
    }),
    preview: previewSchema,
  })
  .refine((value) => value.endDate > value.sourceDate, { message: messages.invalidRequest });

export type RepeatDayInput = z.infer<typeof repeatDaySchema>;

export const plannedAddedResponseSchema = z
  .object({
    added: z.number().int().min(0).meta({
      description: "Planned items added, or that would be added when preview is true.",
    }),
  })
  .meta({ id: "PlannedAdded", description: "How many planned items an action added." });

export type PlannedAddedResponse = z.infer<typeof plannedAddedResponseSchema>;
