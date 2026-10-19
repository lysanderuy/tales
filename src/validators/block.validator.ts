import { z } from "zod";

import { messages } from "@/lib/messages";

const idSchema = z.string().uuid();

export const blockIdParamSchema = idSchema;

const nodeIdSchema = idSchema.meta({ description: "Subject or Topic ID." });

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

const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .meta({ description: "Time of day label, HH:mm. Does not affect order.", example: "08:30" });

const plannedMinutesSchema = z
  .number()
  .int()
  .min(1)
  .max(720)
  .meta({ description: "Planned minutes, 1 to 720. Empty means open-ended.", example: 60 });

const positionSchema = z
  .number()
  .int()
  .min(0)
  .meta({ description: "Zero-based place within the date. Defaults to last.", example: 0 });

const eventIdSchema = idSchema.meta({ description: "Event ID." });

export const createBlockSchema = z.object({
  nodeId: nodeIdSchema,
  date: dateKeySchema,
  eventId: eventIdSchema.nullable().optional(),
  timeOfDay: timeOfDaySchema.nullable().optional(),
  plannedMinutes: plannedMinutesSchema.nullable().optional(),
  position: positionSchema.optional(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;

export const updateBlockSchema = z
  .object({
    nodeId: nodeIdSchema.optional(),
    date: dateKeySchema
      .optional()
      .meta({ description: "Moves the item to this day, at the end unless position is given." }),
    eventId: eventIdSchema.nullable().optional(),
    timeOfDay: timeOfDaySchema.nullable().optional(),
    plannedMinutes: plannedMinutesSchema.nullable().optional(),
    position: positionSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: messages.invalidRequest,
  });

export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;

export const reorderBlocksSchema = z.object({
  date: dateKeySchema,
  orderedIds: z
    .array(idSchema)
    .max(1000)
    .refine((ids) => new Set(ids).size === ids.length, messages.invalidRequest)
    .meta({ description: "Every planned item ID on that day, in the new order." }),
});

export type ReorderBlocksInput = z.infer<typeof reorderBlocksSchema>;

export const listBlocksQuerySchema = z
  .object({
    date: dateKeySchema.optional(),
    eventId: eventIdSchema.optional().meta({ description: "Only items tied to this event." }),
    from: dateKeySchema.optional().meta({ description: "First day of the range, inclusive." }),
    to: dateKeySchema.optional().meta({ description: "Last day of the range, inclusive." }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(500)
      .default(200)
      .meta({ description: "Most items to return, up to 500.", example: 200 }),
  })
  .refine(
    (value) => {
      if (value.date !== undefined) return value.from === undefined && value.to === undefined;
      if (value.from === undefined && value.to === undefined) return value.eventId !== undefined;
      return value.from !== undefined && value.to !== undefined && value.from <= value.to;
    },
    { message: messages.invalidRequest },
  );

export type ListBlocksQuery = z.infer<typeof listBlocksQuerySchema>;

export const startBlockSchema = z.object({
  startedFrom: z
    .enum(["planned", "next_up"])
    .default("planned")
    .meta({ description: "How the timer was started. Defaults to planned." }),
});

export type StartBlockInput = z.infer<typeof startBlockSchema>;

export const planSummaryQuerySchema = z
  .object({
    from: dateKeySchema.meta({ description: "First day of the range, inclusive." }),
    to: dateKeySchema.meta({ description: "Last day of the range, inclusive." }),
  })
  .refine((value) => value.from <= value.to, { message: messages.invalidRequest });

export type PlanSummaryQuery = z.infer<typeof planSummaryQuerySchema>;

export const blockResponseSchema = z
  .object({
    id: idSchema,
    nodeId: idSchema.meta({ description: "Subject or Topic ID." }),
    date: dateKeySchema,
    timeOfDay: timeOfDaySchema.nullable(),
    plannedMinutes: z.number().int().nullable(),
    position: z.number().int().meta({ description: "Zero-based place within the date." }),
    eventId: idSchema.nullable().meta({ description: "Linked Event ID, if any." }),
    progressSeconds: z.number().meta({
      description: "Time studied on stopped records linked to this item, not counting pauses.",
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({ id: "PlannedItem", description: "A planned item on the Plan tab." });

export type BlockResponse = z.infer<typeof blockResponseSchema>;

export const planSummaryResponseSchema = z
  .array(
    z.object({
      rootId: idSchema.meta({ description: "Subject ID." }),
      plannedMinutes: z.number().meta({ description: "Planned minutes across its items." }),
      openCount: z.number().int().meta({ description: "Items with no planned minutes." }),
    }),
  )
  .meta({ id: "PlanSummary", description: "Planned minutes per Subject." });

export type PlanSummaryResponse = z.infer<typeof planSummaryResponseSchema>;
