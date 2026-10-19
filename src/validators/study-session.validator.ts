import { z } from "zod";

import { messages } from "@/lib/messages";

const idSchema = z.string().uuid();

export const sessionIdParamSchema = idSchema;

const instantSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .meta({ description: "ISO 8601 timestamp.", example: "2026-01-15T09:30:00.000Z" });

const nodeIdSchema = idSchema.meta({ description: "Subject or Topic ID." });

const plannedMinutesSchema = z
  .number()
  .int()
  .min(1)
  .max(600)
  .meta({ description: "Countdown length in minutes, 1 to 600.", example: 45 });

const methodTagSchema = z
  .enum(["lecture_notes", "personal_notes", "flashcards", "questions"])
  .meta({ description: "How the time was spent.", example: "flashcards" });

const noteSchema = z
  .string()
  .max(5000, messages.noteTooLong)
  .meta({ description: "Free text, up to 5000 characters." });

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ description: "Local calendar day, YYYY-MM-DD.", example: "2026-01-15" });

export const startSessionSchema = z.object({
  nodeId: nodeIdSchema.optional().meta({ description: "Subject or Topic ID. Can be set later." }),
  plannedMinutes: plannedMinutesSchema.optional(),
  startedFrom: z
    .literal("free")
    .default("free")
    .meta({ description: "How the timer was started. Only free for now." }),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const updateSessionSchema = z
  .object({
    nodeId: nodeIdSchema.optional(),
    methodTag: methodTagSchema.nullable().optional(),
    note: noteSchema.nullable().optional(),
    startedAt: instantSchema.optional(),
    endedAt: instantSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: messages.invalidRequest,
  });

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

export const stopSessionSchema = z.object({
  endedAt: instantSchema.optional().meta({
    description: "Stop at this time instead of now. Must be between the start and now.",
  }),
});

export type StopSessionInput = z.infer<typeof stopSessionSchema>;

export const extendSessionSchema = z.object({
  minutes: plannedMinutesSchema,
});

export type ExtendSessionInput = z.infer<typeof extendSessionSchema>;

export const manualSessionSchema = z
  .object({
    nodeId: nodeIdSchema,
    startedAt: instantSchema,
    endedAt: instantSchema,
    methodTag: methodTagSchema.nullable().optional(),
    note: noteSchema.nullable().optional(),
  })
  .refine((value) => value.startedAt.getTime() < value.endedAt.getTime(), {
    message: messages.endBeforeStart,
    path: ["endedAt"],
  });

export type ManualSessionInput = z.infer<typeof manualSessionSchema>;

export const listSessionsQuerySchema = z
  .object({
    date: dateKeySchema.optional(),
    from: instantSchema
      .optional()
      .meta({ description: "Records that started at or after this time." }),
    to: instantSchema.optional().meta({ description: "Records that started before this time." }),
    nodeId: nodeIdSchema
      .optional()
      .meta({ description: "Only this Subject or Topic and everything under it." }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(500)
      .default(200)
      .meta({ description: "Most records to return, up to 500.", example: 200 }),
  })
  .refine(
    (value) => value.date === undefined || (value.from === undefined && value.to === undefined),
    { message: messages.invalidRequest },
  );

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const sessionResponseSchema = z
  .object({
    id: idSchema,
    nodeId: idSchema
      .nullable()
      .meta({ description: "Subject or Topic ID, null if not chosen yet." }),
    plannedMinutes: z
      .number()
      .int()
      .nullable()
      .meta({ description: "Countdown length including added time. Null for a count-up." }),
    methodTag: methodTagSchema.nullable(),
    note: z.string().nullable(),
    startedFrom: z.enum(["free", "planned", "next_up"]),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().nullable(),
    state: z.enum(["running", "paused", "stopped"]),
    activeSeconds: z
      .number()
      .meta({ description: "Time studied, not counting pauses, as of serverNow or the stop." }),
    pauses: z.array(
      z.object({
        pausedAt: z.string().datetime(),
        resumedAt: z.string().datetime().nullable(),
      }),
    ),
    lastHeartbeatAt: z.string().datetime(),
    pending: z.boolean().meta({
      description: "True when stopped but no Subject or Topic has been chosen yet.",
    }),
    stale: z.boolean().meta({
      description: "True when running and the last heartbeat is older than 15 minutes.",
    }),
    createdAt: z.string().datetime(),
  })
  .meta({ id: "StudyRecord", description: "A timer or a record of studied time." });

export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const currentSessionResponseSchema = z
  .object({
    session: sessionResponseSchema.nullable().meta({
      description: "The running or paused timer, else a stopped record waiting for a Subject.",
    }),
    serverNow: z.string().datetime().meta({ description: "Server clock at response time." }),
  })
  .meta({ id: "CurrentStudyRecord" });

export type CurrentSessionResponse = z.infer<typeof currentSessionResponseSchema>;
