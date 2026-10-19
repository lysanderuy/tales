import { z } from "zod";

import { dateKeySchema } from "@/validators/plan-copy.validator";

const idSchema = z.string().uuid();

export const templateIdParamSchema = idSchema;

const nameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .meta({ description: "Template name, 1 to 60 characters.", example: "Weekday routine" });

export const createTemplateSchema = z.object({
  name: nameSchema,
  fromDate: dateKeySchema.meta({ description: "The day whose planned items are saved, in order." }),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const renameTemplateSchema = z.object({ name: nameSchema });

export type RenameTemplateInput = z.infer<typeof renameTemplateSchema>;

export const applyTemplateSchema = z.object({
  date: dateKeySchema.meta({ description: "The day to add the template's planned items to." }),
  preview: z.boolean().optional().meta({
    description: "When true, nothing is written and added is the count the action would add.",
  }),
});

export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;

export const templateResponseSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    items: z.array(
      z.object({
        nodeId: idSchema.meta({ description: "Subject or Topic ID." }),
        timeOfDay: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
          .nullable()
          .meta({ description: "Time of day label, HH:mm." }),
        plannedMinutes: z.number().int().nullable(),
        position: z.number().int().meta({ description: "Zero-based place in the template." }),
      }),
    ),
    createdAt: z.string().datetime(),
  })
  .meta({ id: "Template", description: "A saved day that can be added to any date." });

export type TemplateResponse = z.infer<typeof templateResponseSchema>;
