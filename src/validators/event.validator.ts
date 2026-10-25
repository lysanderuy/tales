import { z } from "zod";

import { messages } from "@/lib/messages";

const idSchema = z.string().uuid();

export const eventIdParamSchema = idSchema;

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
  .meta({ description: "Local calendar day, YYYY-MM-DD.", example: "2026-03-02" });

const clockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .meta({ description: "Local time, HH:mm.", example: "09:30" });

const titleSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .meta({ description: "Event title, 1 to 100 characters.", example: "Preboard 1" });

const typeSchema = z
  .enum(["mock_board", "preboard", "subject_exam", "review_center_exam"])
  .meta({ id: "EventType", description: "Kind of event." });

const noteSchema = z
  .string()
  .max(5000, messages.noteTooLong)
  .meta({ description: "Her note about how the event went, up to 5000 characters." });

const coverIdsSchema = z
  .array(nodeIdSchema)
  .max(200)
  .refine((ids) => new Set(ids).size === ids.length, messages.invalidRequest)
  .meta({ description: "Subjects or Topics the event covers, at any depth." });

const markSchema = z
  .enum(["confident", "review_again"])
  .meta({ id: "EventMark", description: "Her mark on a Subject or Topic within one event." });

const stateSchema = z.enum(["upcoming", "ready_to_close", "closed"]).meta({
  id: "EventState",
  description: "Upcoming until the date or time passes, then Ready to close until she closes it.",
});

export const createEventSchema = z.object({
  title: titleSchema,
  type: typeSchema.nullable().optional(),
  date: dateKeySchema,
  time: clockSchema.nullable().optional(),
  coverIds: coverIdsSchema.optional(),
  note: noteSchema.nullable().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: titleSchema.optional(),
    type: typeSchema.nullable().optional(),
    date: dateKeySchema.optional(),
    time: clockSchema.nullable().optional(),
    coverIds: coverIdsSchema.optional().meta({
      description: "Replaces the covers. Send an empty list to clear them.",
    }),
    note: noteSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: messages.invalidRequest,
  });

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const closeEventSchema = z.object({
  note: noteSchema.nullable().optional(),
  marks: z
    .array(
      z.object({
        nodeId: nodeIdSchema,
        mark: markSchema.nullable().meta({ description: "Null clears the mark." }),
      }),
    )
    .max(500)
    .refine((marks) => new Set(marks.map((m) => m.nodeId)).size === marks.length, {
      message: messages.invalidRequest,
    })
    .optional()
    .meta({ description: "Marks to set or clear. Items not listed keep their mark." }),
});

export type CloseEventInput = z.infer<typeof closeEventSchema>;

export const listEventsQuerySchema = z
  .object({
    from: dateKeySchema.optional().meta({ description: "First day of the range, inclusive." }),
    to: dateKeySchema.optional().meta({ description: "Last day of the range, inclusive." }),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: messages.invalidRequest,
  });

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

const eventBaseShape = {
  id: idSchema,
  title: z.string(),
  type: typeSchema.nullable(),
  date: dateKeySchema,
  time: clockSchema.nullable(),
  state: stateSchema,
  closedAt: z.string().datetime().nullable(),
  coverIds: z.array(nodeIdSchema).meta({ description: "Subjects or Topics the event covers." }),
};

export const eventSummaryResponseSchema = z
  .object(eventBaseShape)
  .meta({ id: "EventSummary", description: "An event in the Events list." });

export type EventSummaryResponse = z.infer<typeof eventSummaryResponseSchema>;

export const eventListResponseSchema = z
  .object({
    events: z
      .array(eventSummaryResponseSchema)
      .meta({ description: "Ready to close first, then Upcoming, then Closed." }),
    hasReadyToClose: z
      .boolean()
      .meta({ description: "True when at least one event is Ready to close." }),
  })
  .meta({ id: "EventList" });

export type EventListResponse = z.infer<typeof eventListResponseSchema>;

export const eventDetailResponseSchema = z
  .object({
    ...eventBaseShape,
    note: z.string().nullable(),
    blocks: z
      .array(
        z.object({
          id: idSchema.meta({ description: "Planned item ID." }),
          nodeId: nodeIdSchema,
          date: dateKeySchema,
          plannedMinutes: z.number().int().nullable(),
          progressSeconds: z.number(),
        }),
      )
      .meta({ description: "Planned items tied to this event." }),
    sessionSecondsByNode: z.array(z.object({ nodeId: nodeIdSchema, seconds: z.number() })).meta({
      description: "Time studied in records counted for this event, by Subject or Topic.",
    }),
    sessions: z
      .array(
        z.object({
          id: idSchema.meta({ description: "Study session ID." }),
          nodeId: nodeIdSchema,
          startedAt: z.string().datetime(),
          endedAt: z.string().datetime(),
          seconds: z.number().meta({ description: "Time studied, excluding paused time." }),
        }),
      )
      .meta({
        description: "Finished study records counted for this event, newest first.",
      }),
    marks: z.array(z.object({ nodeId: nodeIdSchema, mark: markSchema })),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .meta({
    id: "Event",
    description: "One event with its covers, planned items, sessions, note and marks.",
  });

export type EventDetailResponse = z.infer<typeof eventDetailResponseSchema>;
