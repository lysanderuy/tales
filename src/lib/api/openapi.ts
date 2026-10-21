import { z } from "zod";
import { createDocument, type ZodOpenApiPathsObject } from "zod-openapi";
import {
  blockResponseSchema,
  createBlockSchema,
  listBlocksQuerySchema,
  planSummaryQuerySchema,
  planSummaryResponseSchema,
  reorderBlocksSchema,
  startBlockSchema,
  updateBlockSchema,
} from "@/validators/block.validator";
import {
  bulkDailyLinesResponseSchema,
  bulkDailyLinesSchema,
  createDailyLineSchema,
  createDailySetSchema,
  dailyLineResponseSchema,
  dailySetActivationSchema,
  dailySetResponseSchema,
  renameDailySetSchema,
  todaysLineSchema,
  updateDailyLineSchema,
} from "@/validators/daily-set.validator";
import {
  closeEventSchema,
  createEventSchema,
  eventDetailResponseSchema,
  eventListResponseSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from "@/validators/event.validator";
import {
  createOutlineNodeSchema,
  listOutlineNodesQuerySchema,
  moveOutlineNodeSchema,
  outlineNodeResponseSchema,
  reorderOutlineNodesSchema,
  updateOutlineNodeSchema,
} from "@/validators/outline-node.validator";
import {
  currentSessionResponseSchema,
  extendSessionSchema,
  listSessionsQuerySchema,
  manualSessionSchema,
  sessionResponseSchema,
  startSessionSchema,
  stopSessionSchema,
  updateSessionSchema,
} from "@/validators/study-session.validator";
import {
  copyDaySchema,
  plannedAddedResponseSchema,
  repeatDaySchema,
} from "@/validators/plan-copy.validator";
import {
  applyTemplateSchema,
  createTemplateSchema,
  renameTemplateSchema,
  templateResponseSchema,
} from "@/validators/template.validator";
import { profileResponseSchema, updateProfileSchema } from "@/validators/profile.validator";
import { reportQuerySchema, reportResponseSchema } from "@/validators/report.validator";
import {
  nextUpQuerySchema,
  nextUpResponseSchema,
  pickerQuerySchema,
  pickerResponseSchema,
  todayResponseSchema,
} from "@/validators/today.validator";

function successEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.string().meta({ example: "Unauthorized" }),
});

function jsonResponse<T extends z.ZodType>(description: string, schema: T) {
  return {
    description,
    content: { "application/json": { schema: successEnvelope(schema) } },
  };
}

function errorResponse(description: string) {
  return { description, content: { "application/json": { schema: errorEnvelope } } };
}

const pathMethods = ["get", "put", "post", "patch", "delete"] as const;

// Every route can fail with a 500; every {id} route with a 422 for a non-UUID id.
function withSharedErrors(paths: ZodOpenApiPathsObject): ZodOpenApiPathsObject {
  for (const [path, item] of Object.entries(paths)) {
    if (typeof item === "string") continue;
    for (const method of pathMethods) {
      const operation = item[method];
      if (!operation) continue;
      operation.responses = {
        ...(path.includes("{id}") && { "422": errorResponse("Validation error.") }),
        ...operation.responses,
        "500": errorResponse("Server error."),
      };
    }
  }
  return paths;
}

const subjectIdParams = z.object({
  id: z.string().uuid().meta({ description: "Subject or Topic ID." }),
});

const sessionIdParams = z.object({
  id: z.string().uuid().meta({ description: "Timer or study record ID." }),
});

const blockIdParams = z.object({
  id: z.string().uuid().meta({ description: "Planned item ID." }),
});

const eventIdParams = z.object({
  id: z.string().uuid().meta({ description: "Event ID." }),
});

const templateIdParams = z.object({
  id: z.string().uuid().meta({ description: "Template ID." }),
});

const dailySetIdParams = z.object({
  id: z.string().uuid().meta({ description: "Daily Set ID." }),
});

const dailyLineIdParams = z.object({
  id: z.string().uuid().meta({ description: "Line ID." }),
});

const planTags = ["Plan"];

const dailyTags = ["Daily Sets"];

const eventTags = ["Events"];

const sessionTags = ["Study timer"];

function sessionAction(
  summary: string,
  ok: string,
  extra: Record<string, ReturnType<typeof errorResponse>> = {},
) {
  return {
    post: {
      tags: sessionTags,
      summary,
      requestParams: { path: sessionIdParams },
      responses: {
        "200": jsonResponse(ok, sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        ...extra,
      },
    },
  };
}

const paths: ZodOpenApiPathsObject = {
  "/api/profile": {
    get: {
      summary: "Get the authenticated user's profile",
      responses: {
        "200": {
          description: "Profile retrieved successfully.",
          content: {
            "application/json": { schema: successEnvelope(profileResponseSchema) },
          },
        },
        "401": {
          description: "Unauthorized.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
        "404": {
          description: "Profile not found.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
      },
    },
    patch: {
      summary: "Update the authenticated user's profile",
      requestBody: {
        content: {
          "application/json": { schema: updateProfileSchema },
        },
      },
      responses: {
        "200": {
          description: "Profile updated successfully.",
          content: {
            "application/json": { schema: successEnvelope(profileResponseSchema) },
          },
        },
        "401": {
          description: "Unauthorized.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
        "404": {
          description: "Profile not found.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
        "422": {
          description: "Validation error.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
      },
    },
  },
  "/api/account": {
    delete: {
      summary: "Delete the authenticated user's account and all of their data",
      responses: {
        "200": {
          description: "Account deleted.",
          content: {
            "application/json": {
              schema: successEnvelope(
                z.object({ deleted: z.literal(true).meta({ example: true }) }),
              ),
            },
          },
        },
        "401": {
          description: "Unauthorized.",
          content: {
            "application/json": { schema: errorEnvelope },
          },
        },
        "409": errorResponse("Account data could not be removed because something depends on it."),
        "500": errorResponse("Account deletion failed; try again."),
      },
    },
  },
  "/api/subjects": {
    get: {
      summary: "List Subjects and Topics as a flat tree-ordered list",
      requestParams: { query: listOutlineNodesQuerySchema },
      responses: {
        "200": jsonResponse("Subjects and Topics.", z.array(outlineNodeResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
    post: {
      summary: "Create a Subject (no parentId) or a Topic",
      requestBody: { content: { "application/json": { schema: createOutlineNodeSchema } } },
      responses: {
        "201": jsonResponse("Created.", outlineNodeResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Parent not found."),
        "409": errorResponse("That name is already used under the same parent."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/subjects/{id}": {
    patch: {
      summary: "Rename, set exam weight, archive or restore a Subject or Topic",
      requestParams: { path: subjectIdParams },
      requestBody: { content: { "application/json": { schema: updateOutlineNodeSchema } } },
      responses: {
        "200": jsonResponse("Updated.", outlineNodeResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "409": errorResponse("That name is already used under the same parent."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      summary: "Delete a Subject or Topic and everything below it",
      requestParams: { path: subjectIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "409": errorResponse("Study time or plans are attached; archive instead."),
      },
    },
  },
  "/api/subjects/{id}/move": {
    post: {
      summary: "Move a Subject or Topic under another parent, or to the top level",
      requestParams: { path: subjectIdParams },
      requestBody: { content: { "application/json": { schema: moveOutlineNodeSchema } } },
      responses: {
        "200": jsonResponse("Moved.", outlineNodeResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Item or new parent not found."),
        "409": errorResponse("That name is already used under the new parent."),
        "422": errorResponse("Cannot move under itself or its own children, or invalid input."),
      },
    },
  },
  "/api/subjects/reorder": {
    post: {
      summary: "Reorder the children of one parent (or the Subjects)",
      requestBody: { content: { "application/json": { schema: reorderOutlineNodesSchema } } },
      responses: {
        "200": jsonResponse("Reordered children.", z.array(outlineNodeResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Parent not found."),
        "422": errorResponse("Ids do not match the current children, or invalid input."),
      },
    },
  },
  "/api/blocks": {
    get: {
      tags: planTags,
      summary: "List planned items for one day, a day range or one Event, with time studied so far",
      requestParams: { query: listBlocksQuerySchema },
      responses: {
        "200": jsonResponse("Planned items by day, then order.", z.array(blockResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
    post: {
      tags: planTags,
      summary: "Add a planned item. It goes last on its day unless position is given.",
      requestBody: { content: { "application/json": { schema: createBlockSchema } } },
      responses: {
        "201": jsonResponse("Added.", blockResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject, Topic or Event not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/blocks/reorder": {
    post: {
      tags: planTags,
      summary: "Reorder every planned item on one day",
      requestBody: { content: { "application/json": { schema: reorderBlocksSchema } } },
      responses: {
        "200": jsonResponse("Reordered items.", z.array(blockResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Ids do not match the items on that day, or invalid input."),
      },
    },
  },
  "/api/blocks/{id}": {
    patch: {
      tags: planTags,
      summary:
        "Change Subject or Topic, Event, day, time of day, planned minutes or place. A new day puts it last.",
      requestParams: { path: blockIdParams },
      requestBody: { content: { "application/json": { schema: updateBlockSchema } } },
      responses: {
        "200": jsonResponse("Updated.", blockResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Item, Subject, Topic or Event not found."),
        "409": errorResponse("The change conflicts with existing data."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      tags: planTags,
      summary: "Delete a planned item. Study records on it are kept.",
      requestParams: { path: blockIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/blocks/{id}/start": {
    post: {
      tags: planTags,
      summary:
        "Start a timer on a planned item. A countdown of the minutes left, or open if none are left. Returns the existing timer (200) if one is running.",
      requestParams: { path: blockIdParams },
      requestBody: { content: { "application/json": { schema: startBlockSchema } } },
      responses: {
        "200": jsonResponse(
          "A timer was already running; it is returned unchanged.",
          sessionResponseSchema,
        ),
        "201": jsonResponse("Timer started.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/plan/summary": {
    get: {
      tags: planTags,
      summary: "Planned minutes per Subject over a day range. Open-ended items are counted apart.",
      requestParams: { query: planSummaryQuerySchema },
      responses: {
        "200": jsonResponse("Per-Subject totals.", planSummaryResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/sessions": {
    get: {
      tags: sessionTags,
      summary: "List stopped study records, newest first, by local day or time range",
      requestParams: { query: listSessionsQuerySchema },
      responses: {
        "200": jsonResponse("Study records.", z.array(sessionResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject or Topic not found."),
        "422": errorResponse("Validation error."),
      },
    },
    post: {
      tags: sessionTags,
      summary:
        "Start a timer, optionally on a planned item. Returns the existing one (200) if a timer is already running.",
      requestBody: { content: { "application/json": { schema: startSessionSchema } } },
      responses: {
        "200": jsonResponse(
          "A timer was already running; it is returned unchanged.",
          sessionResponseSchema,
        ),
        "201": jsonResponse("Timer started.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject, Topic or planned item not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/sessions/current": {
    get: {
      tags: sessionTags,
      summary: "Get the running or paused timer, else a stopped record waiting for a Subject",
      responses: {
        "200": jsonResponse("Current timer and server time.", currentSessionResponseSchema),
        "401": errorResponse("Unauthorized."),
      },
    },
  },
  "/api/sessions/manual": {
    post: {
      tags: sessionTags,
      summary: "Add a stopped record by hand",
      requestBody: { content: { "application/json": { schema: manualSessionSchema } } },
      responses: {
        "201": jsonResponse("Added.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject or Topic not found."),
        "409": errorResponse("Overlaps another record; the message names it."),
        "422": errorResponse("Validation error, or a time in the future."),
      },
    },
  },
  "/api/sessions/{id}": {
    get: {
      tags: sessionTags,
      summary: "Get one record",
      requestParams: { path: sessionIdParams },
      responses: {
        "200": jsonResponse("The record.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
    patch: {
      tags: sessionTags,
      summary:
        "Edit Subject or Topic, planned item, method, note, or (stopped records only) start and end. A new Subject or Topic outside the planned item detaches it. Editing start or end times discards pauses, so active time becomes end minus start. nodeId and blockId must not both be sent (422).",
      requestParams: { path: sessionIdParams },
      requestBody: { content: { "application/json": { schema: updateSessionSchema } } },
      responses: {
        "200": jsonResponse("Updated.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "409": errorResponse("Overlaps another record; the message names it."),
        "422": errorResponse("Validation error, or times edited while still running."),
      },
    },
    delete: {
      tags: sessionTags,
      summary: "Delete a running, pending or stopped record",
      requestParams: { path: sessionIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/sessions/{id}/pause": sessionAction("Pause the timer", "Paused.", {
    "409": errorResponse("Already paused, or nothing is running."),
  }),
  "/api/sessions/{id}/resume": sessionAction("Resume the timer", "Resumed.", {
    "409": errorResponse("Not paused, or nothing is running."),
  }),
  "/api/sessions/{id}/heartbeat": sessionAction(
    "Record that the app is open. Only moves the heartbeat while running.",
    "Heartbeat recorded.",
    { "409": errorResponse("Nothing is running.") },
  ),
  "/api/sessions/{id}/stop": {
    post: {
      tags: sessionTags,
      summary: "Stop the timer now, or at an earlier time between the start and now",
      requestParams: { path: sessionIdParams },
      requestBody: { content: { "application/json": { schema: stopSessionSchema } } },
      responses: {
        "200": jsonResponse("Stopped.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "409": errorResponse("Already stopped and a stop time was given."),
        "422": errorResponse("Stop time is before the start or in the future."),
      },
    },
  },
  "/api/sessions/{id}/extend": {
    post: {
      tags: sessionTags,
      summary: "Add time to a countdown, counted from the time studied so far",
      requestParams: { path: sessionIdParams },
      requestBody: { content: { "application/json": { schema: extendSessionSchema } } },
      responses: {
        "200": jsonResponse("Extended.", sessionResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "409": errorResponse("Nothing is running."),
        "422": errorResponse("Not a countdown, or validation error."),
      },
    },
  },
  "/api/events": {
    get: {
      tags: eventTags,
      summary:
        "List Events, optionally within a day range. Ready to close first, then Upcoming, then Closed.",
      requestParams: { query: listEventsQuerySchema },
      responses: {
        "200": jsonResponse("Events.", eventListResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
    post: {
      tags: eventTags,
      summary: "Add an Event",
      requestBody: { content: { "application/json": { schema: createEventSchema } } },
      responses: {
        "201": jsonResponse("Added.", eventDetailResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject or Topic not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/events/{id}": {
    get: {
      tags: eventTags,
      summary: "One Event with its covers, planned items, time studied, note and marks",
      requestParams: { path: eventIdParams },
      responses: {
        "200": jsonResponse("Event.", eventDetailResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
    patch: {
      tags: eventTags,
      summary:
        "Change an Event. Covers are replaced when given. A Closed Event stays Closed when edited.",
      requestParams: { path: eventIdParams },
      requestBody: { content: { "application/json": { schema: updateEventSchema } } },
      responses: {
        "200": jsonResponse("Updated.", eventDetailResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Event, Subject or Topic not found."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      tags: eventTags,
      summary: "Delete an Event. Planned items are kept and unlinked; study records are kept.",
      requestParams: { path: eventIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/events/{id}/close": {
    post: {
      tags: eventTags,
      summary:
        "Close an Event, or save its note and marks again if already Closed. A null mark clears it. Never reopens.",
      requestParams: { path: eventIdParams },
      requestBody: { content: { "application/json": { schema: closeEventSchema } } },
      responses: {
        "200": jsonResponse("Closed.", eventDetailResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "422": errorResponse("A mark is on something the Event does not cover or plan."),
      },
    },
  },
  "/api/plan/copy": {
    post: {
      tags: planTags,
      summary:
        "Copy a day's planned items onto other days, after what is already there. With preview, only counts.",
      requestBody: { content: { "application/json": { schema: copyDaySchema } } },
      responses: {
        "200": jsonResponse("How many were added, or would be.", plannedAddedResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error, or too many items for one request."),
      },
    },
  },
  "/api/plan/repeat": {
    post: {
      tags: planTags,
      summary:
        "Repeat a day's planned items on chosen weekdays after it, up to an end date. With preview, only counts.",
      requestBody: { content: { "application/json": { schema: repeatDaySchema } } },
      responses: {
        "200": jsonResponse("How many were added, or would be.", plannedAddedResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error, range too long, or too many items."),
      },
    },
  },
  "/api/templates": {
    get: {
      tags: planTags,
      summary: "List templates with their items",
      responses: {
        "200": jsonResponse("Templates, newest first.", z.array(templateResponseSchema)),
        "401": errorResponse("Unauthorized."),
      },
    },
    post: {
      tags: planTags,
      summary: "Save a day's planned items, in order, as a template",
      requestBody: { content: { "application/json": { schema: createTemplateSchema } } },
      responses: {
        "201": jsonResponse("Saved.", templateResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error, or nothing planned on that day."),
      },
    },
  },
  "/api/templates/{id}": {
    patch: {
      tags: planTags,
      summary: "Rename a template",
      requestParams: { path: templateIdParams },
      requestBody: { content: { "application/json": { schema: renameTemplateSchema } } },
      responses: {
        "200": jsonResponse("Renamed.", templateResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      tags: planTags,
      summary: "Delete a template. Planned items already made from it are not affected.",
      requestParams: { path: templateIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/templates/{id}/apply": {
    post: {
      tags: planTags,
      summary:
        "Add a template's planned items to a day, after what is already there. With preview, only counts.",
      requestParams: { path: templateIdParams },
      requestBody: { content: { "application/json": { schema: applyTemplateSchema } } },
      responses: {
        "200": jsonResponse("How many were added, or would be.", plannedAddedResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/daily-sets": {
    get: {
      tags: dailyTags,
      summary: "List Daily Sets: Built-in first, then your own",
      responses: {
        "200": jsonResponse(
          "Sets with Active state and Line counts.",
          z.array(dailySetResponseSchema),
        ),
        "401": errorResponse("Unauthorized."),
      },
    },
    post: {
      tags: dailyTags,
      summary: "Create your own Daily Set",
      requestBody: { content: { "application/json": { schema: createDailySetSchema } } },
      responses: {
        "201": jsonResponse("Created.", dailySetResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/daily-sets/{id}": {
    patch: {
      tags: dailyTags,
      summary: "Rename one of your own Daily Sets",
      requestParams: { path: dailySetIdParams },
      requestBody: { content: { "application/json": { schema: renameDailySetSchema } } },
      responses: {
        "200": jsonResponse("Renamed.", dailySetResponseSchema),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      tags: dailyTags,
      summary: "Delete one of your own Daily Sets and its Lines",
      requestParams: { path: dailySetIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/daily-sets/{id}/activation": {
    put: {
      tags: dailyTags,
      summary: "Switch a Daily Set on or off for you. Works on Built-in Sets too.",
      requestParams: { path: dailySetIdParams },
      requestBody: { content: { "application/json": { schema: dailySetActivationSchema } } },
      responses: {
        "200": jsonResponse("Updated.", dailySetResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/daily-sets/{id}/lines": {
    get: {
      tags: dailyTags,
      summary: "List the Lines in a Daily Set, with which ones you have hidden",
      requestParams: { path: dailySetIdParams },
      responses: {
        "200": jsonResponse("Lines in order.", z.array(dailyLineResponseSchema)),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
    post: {
      tags: dailyTags,
      summary: "Add a Line to one of your own Daily Sets",
      requestParams: { path: dailySetIdParams },
      requestBody: { content: { "application/json": { schema: createDailyLineSchema } } },
      responses: {
        "201": jsonResponse("Added.", dailyLineResponseSchema),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/daily-sets/{id}/lines/bulk": {
    post: {
      tags: dailyTags,
      summary:
        "Paste many Lines at once, one per row. Empty rows and duplicates are skipped. With preview, only counts.",
      requestParams: { path: dailySetIdParams },
      requestBody: { content: { "application/json": { schema: bulkDailyLinesSchema } } },
      responses: {
        "200": jsonResponse("How many were added, or would be.", bulkDailyLinesResponseSchema),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/daily-lines/{id}": {
    patch: {
      tags: dailyTags,
      summary: "Edit a Line in one of your own Daily Sets",
      requestParams: { path: dailyLineIdParams },
      requestBody: { content: { "application/json": { schema: updateDailyLineSchema } } },
      responses: {
        "200": jsonResponse("Updated.", dailyLineResponseSchema),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
        "422": errorResponse("Validation error."),
      },
    },
    delete: {
      tags: dailyTags,
      summary: "Delete a Line from one of your own Daily Sets",
      requestParams: { path: dailyLineIdParams },
      responses: {
        "200": jsonResponse("Deleted.", z.object({ deleted: z.literal(true) })),
        "401": errorResponse("Unauthorized."),
        "403": errorResponse("Built-in Sets can't be changed."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/daily-lines/{id}/hide": {
    post: {
      tags: dailyTags,
      summary: "Hide a Line for you. Works on Built-in and your own Sets.",
      requestParams: { path: dailyLineIdParams },
      responses: {
        "200": jsonResponse("Hidden.", dailyLineResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/daily-lines/{id}/unhide": {
    post: {
      tags: dailyTags,
      summary: "Show a hidden Line again",
      requestParams: { path: dailyLineIdParams },
      responses: {
        "200": jsonResponse("Visible.", dailyLineResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Not found."),
      },
    },
  },
  "/api/daily-line": {
    get: {
      tags: dailyTags,
      summary:
        "Today's Line. Chosen once per day from visible Lines of Active Sets, and redrawn if it is hidden or its Set is switched off.",
      responses: {
        "200": jsonResponse("Today's Line, or null when none.", todaysLineSchema),
        "401": errorResponse("Unauthorized."),
      },
    },
  },
  "/api/today": {
    get: {
      tags: ["Today"],
      summary:
        "Today's study, time by Subject, the past 7 days, days to boards, the next Upcoming Event and today's Line",
      responses: {
        "200": jsonResponse("Today.", todayResponseSchema),
        "401": errorResponse("Unauthorized."),
      },
    },
  },
  "/api/today/next-up": {
    get: {
      tags: ["Today"],
      summary: "The next planned row for today, or null when none has time left",
      requestParams: { query: nextUpQuerySchema },
      responses: {
        "200": jsonResponse("Next up.", nextUpResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/picker": {
    get: {
      tags: ["Today"],
      summary:
        "Choices for What are you studying: planned rows and recent items, or search results",
      requestParams: { query: pickerQuerySchema },
      responses: {
        "200": jsonResponse("Picker choices.", pickerResponseSchema),
        "401": errorResponse("Unauthorized."),
        "422": errorResponse("Validation error."),
      },
    },
  },
  "/api/reports": {
    get: {
      tags: ["Reports"],
      summary: "Time studied per Subject, or per Topic when nodeId is given, over a range",
      requestParams: { query: reportQuerySchema },
      responses: {
        "200": jsonResponse("Report.", reportResponseSchema),
        "401": errorResponse("Unauthorized."),
        "404": errorResponse("Subject or Topic not found."),
        "422": errorResponse("Validation error."),
      },
    },
  },
};

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Tales API",
    version: "1.0.0",
  },
  paths: withSharedErrors(paths),
});
