import { z } from "zod";

import { messages } from "@/lib/messages";

export const NODE_NAME_MAX_LENGTH = 200;

const nameSchema = z
  .string()
  .trim()
  .min(1, messages.nodeNameLength)
  .max(NODE_NAME_MAX_LENGTH, messages.nodeNameLength)
  .refine((value) => !value.includes(">"), messages.nodeNameInvalidChar)
  .meta({
    description: `Name, 1 to ${NODE_NAME_MAX_LENGTH} characters, no > character.`,
    example: "Hematology",
  });

const examWeightSchema = z
  .number()
  .min(0, messages.examWeightInvalid)
  .max(100, messages.examWeightInvalid)
  .refine((value) => Math.round(value * 10) / 10 === value, messages.examWeightInvalid)
  .meta({ description: "Exam weight from 0 to 100 with one decimal.", example: 12.5 });

const idSchema = z.string().uuid();

export const nodeIdParamSchema = idSchema;

export const createOutlineNodeSchema = z.object({
  name: nameSchema,
  parentId: idSchema.optional().meta({ description: "Parent ID. Omit to create a Subject." }),
  examWeight: examWeightSchema.optional(),
});

export type CreateOutlineNodeInput = z.infer<typeof createOutlineNodeSchema>;

export const updateOutlineNodeSchema = z
  .object({
    name: nameSchema.optional(),
    examWeight: examWeightSchema.nullable().optional(),
    archived: z
      .boolean()
      .optional()
      .meta({ description: "True to archive, false to restore.", example: false }),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: messages.invalidRequest,
  });

export type UpdateOutlineNodeInput = z.infer<typeof updateOutlineNodeSchema>;

export const moveOutlineNodeSchema = z.object({
  parentId: idSchema.nullable().meta({
    description: "New parent ID, or null to make it a Subject.",
  }),
  position: z.number().int().min(0).optional().meta({
    description: "Zero-based place among the new siblings. Defaults to last.",
    example: 0,
  }),
});

export type MoveOutlineNodeInput = z.infer<typeof moveOutlineNodeSchema>;

export const reorderOutlineNodesSchema = z.object({
  parentId: idSchema
    .nullable()
    .meta({ description: "Parent whose children are reordered, or null for Subjects." }),
  orderedIds: z
    .array(idSchema)
    .min(1)
    .max(1000)
    .refine((ids) => new Set(ids).size === ids.length, messages.invalidRequest)
    .meta({ description: "Every current child ID, in the new order." }),
});

export type ReorderOutlineNodesInput = z.infer<typeof reorderOutlineNodesSchema>;

export const listOutlineNodesQuerySchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
    .meta({ description: "Include archived items. Defaults to false.", example: "false" }),
  includeTotals: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
    .meta({
      description: "Add studied-time totals to each item. Defaults to false.",
      example: "false",
    }),
});

export type ListOutlineNodesQuery = z.infer<typeof listOutlineNodesQuerySchema>;

const totalsSchema = z
  .object({
    totalSeconds: z
      .number()
      .meta({ description: "Studied seconds on this item and everything under it." }),
    ownSeconds: z.number().meta({ description: "Studied seconds on this item alone." }),
    last7DaysSeconds: z.number().meta({
      description: "Studied seconds on this item and below over the last 7 days, today included.",
    }),
    lastStudiedAt: z
      .string()
      .datetime()
      .nullable()
      .meta({ description: "When the most recent study on this item or below started." }),
    hasRecords: z.boolean().meta({
      description: "True if this item or anything under it has study time or planned items.",
    }),
  })
  .meta({ id: "SubjectTotals", description: "Rolled-up studied time." });

export const outlineNodeResponseSchema = z
  .object({
    id: idSchema.meta({ example: "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90" }),
    parentId: idSchema.nullable().meta({ description: "Parent ID, null for a Subject." }),
    name: z.string().meta({ example: "Hematology" }),
    position: z.number().int().meta({ description: "Zero-based place among siblings." }),
    examWeight: z.number().nullable().meta({ description: "Exam weight, if set.", example: 12.5 }),
    archived: z.boolean().meta({ description: "Whether this item itself is archived." }),
    effectivelyArchived: z
      .boolean()
      .meta({ description: "True if this item or any ancestor is archived." }),
    colorIndex: z
      .number()
      .int()
      .min(0)
      .max(7)
      .meta({ description: "Color of the root Subject, shared by every Topic below it." }),
    path: z
      .array(z.string())
      .meta({ description: "Names from the Subject down to this item.", example: ["Hematology"] }),
    totals: totalsSchema.optional().meta({ description: "Present only when includeTotals=true." }),
    createdAt: z.string().datetime().meta({ example: "2026-01-01T00:00:00.000Z" }),
    updatedAt: z.string().datetime().meta({ example: "2026-01-15T09:30:00.000Z" }),
  })
  .meta({ id: "SubjectOrTopic", description: "A Subject or Topic." });

export type OutlineNodeResponse = z.infer<typeof outlineNodeResponseSchema>;
