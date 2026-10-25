import { z } from "zod";

import { timeOfDaySchema } from "@/validators/block.validator";
import { todaysLineSchema } from "@/validators/daily-set.validator";

const idSchema = z.string().uuid();

const nodeIdSchema = idSchema.meta({ description: "Subject or Topic ID." });

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ description: "Local calendar day, YYYY-MM-DD.", example: "2026-01-15" });

const clockSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .meta({ description: "Local time, HH:mm.", example: "13:00" });

export const nextUpQuerySchema = z.object({
  excludeBlockId: idSchema
    .optional()
    .meta({ description: "Planned item to skip, such as the one just studied." }),
});

export type NextUpQuery = z.infer<typeof nextUpQuerySchema>;

export const pickerQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined))
    .meta({ description: "Search text. Matches names along the path, ignoring case." }),
});

export type PickerQuery = z.infer<typeof pickerQuerySchema>;

const plannedRowSchema = z
  .object({
    kind: z.literal("planned"),
    blockId: idSchema.meta({ description: "Planned item ID." }),
    nodeId: nodeIdSchema,
    timeOfDay: timeOfDaySchema.nullable().meta({ description: "Null when no time of day is set." }),
    plannedMinutes: z.number().int().nullable().meta({ description: "Null when open-ended." }),
    progressSeconds: z.number().meta({
      description: "Time studied on this planned item, not counting pauses.",
    }),
    records: z
      .array(
        z.object({
          recordId: idSchema.meta({ description: "Study record ID." }),
          startClock: clockSchema,
          endClock: clockSchema.nullable().meta({ description: "Null while running." }),
          seconds: z.number().meta({ description: "Time studied, not counting pauses." }),
          live: z.boolean().meta({ description: "True while this record's timer is running." }),
        }),
      )
      .meta({ description: "Each record on this row today, earliest first." }),
    live: z.boolean().meta({ description: "True while a timer on this row is running." }),
  })
  .meta({ id: "TodayPlannedRow" });

const freeRowSchema = z
  .object({
    kind: z.literal("free"),
    recordId: idSchema,
    nodeId: nodeIdSchema.nullable().meta({ description: "Null until a Subject is chosen." }),
    seconds: z.number().meta({ description: "Time studied so far, not counting pauses." }),
    startClock: clockSchema,
    endClock: clockSchema.nullable().meta({ description: "Null while running." }),
    live: z.boolean(),
    pending: z.boolean().meta({ description: "True when stopped and waiting for a Subject." }),
  })
  .meta({ id: "TodayFreeRow" });

const subjectSecondsSchema = z.object({
  rootId: idSchema.meta({ description: "Subject ID." }),
  seconds: z.number(),
});

const daysToBoardsSchema = z
  .discriminatedUnion("state", [
    z.object({ state: z.literal("hidden") }),
    z.object({ state: z.literal("days"), days: z.number().int() }),
    z.object({ state: z.literal("today") }),
  ])
  .meta({
    id: "DaysToBoards",
    description: "Hidden when no exam date is set or it has passed.",
  });

const nextEventSchema = z
  .object({
    id: idSchema,
    title: z.string(),
    type: z.enum(["mock_board", "preboard", "subject_exam", "review_center_exam"]).nullable(),
    date: dateKeySchema,
    time: clockSchema.nullable(),
    daysAway: z.number().int().meta({ description: "Whole days from today. 0 means today." }),
  })
  .meta({ id: "NextEvent", description: "The soonest Upcoming event." });

export const todayResponseSchema = z
  .object({
    todayDate: dateKeySchema,
    daysToBoards: daysToBoardsSchema,
    totalSeconds: z.number().meta({ description: "Time studied today, stopped records only." }),
    bySubject: z.array(subjectSecondsSchema),
    past7Days: z
      .array(
        z.object({
          date: dateKeySchema,
          totalSeconds: z.number(),
          bySubject: z.array(subjectSecondsSchema),
        }),
      )
      .meta({ description: "Seven local days ending today, oldest first." }),
    nextEvent: nextEventSchema.nullable(),
    dailyLine: todaysLineSchema.meta({
      description: "The Line for today, shown quietly below days to boards. Null when none.",
    }),
    rows: z
      .array(z.discriminatedUnion("kind", [plannedRowSchema, freeRowSchema]))
      .meta({ description: "Planned rows in plan order, then other study newest first." }),
    serverNow: z.string().datetime(),
  })
  .meta({ id: "Today" });

export type TodayResponse = z.infer<typeof todayResponseSchema>;

export const nextUpResponseSchema = z
  .object({
    blockId: idSchema,
    nodeId: nodeIdSchema,
    minutesLeft: z.number().int().nullable().meta({ description: "Null when open-ended." }),
  })
  .nullable()
  .meta({ id: "NextUp", description: "The next planned row for today, or null." });

export type NextUpResponse = z.infer<typeof nextUpResponseSchema>;

const pickerPlannedSchema = z.object({
  blockId: idSchema.meta({ description: "Planned item ID." }),
  nodeId: nodeIdSchema,
  date: dateKeySchema,
  plannedMinutes: z.number().int().nullable(),
  progressSeconds: z.number(),
});

const pickerNodeSchema = z.object({
  id: nodeIdSchema,
  path: z.array(z.string()).meta({ description: "Names from the Subject down to this item." }),
  colorIndex: z.number().int().min(0).max(7),
});

export const pickerResponseSchema = z
  .object({
    planned: z.array(pickerPlannedSchema).meta({
      description: "Today's planned rows, then ones from the last 7 days with time left.",
    }),
    recent: z
      .array(pickerNodeSchema)
      .optional()
      .meta({ description: "Up to three recently used items. Absent when searching." }),
    nodes: z
      .array(pickerNodeSchema)
      .optional()
      .meta({ description: "Matching Subjects and Topics. Present only when searching." }),
  })
  .meta({ id: "Picker" });

export type PickerResponse = z.infer<typeof pickerResponseSchema>;
