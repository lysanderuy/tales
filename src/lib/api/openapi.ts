import { z } from "zod";
import { createDocument } from "zod-openapi";
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
import { profileResponseSchema, updateProfileSchema } from "@/validators/profile.validator";

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

const subjectIdParams = z.object({
  id: z.string().uuid().meta({ description: "Subject or Topic ID." }),
});

const sessionIdParams = z.object({
  id: z.string().uuid().meta({ description: "Timer or study record ID." }),
});

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

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Tales API",
    version: "1.0.0",
  },
  paths: {
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
        summary: "Start a timer. Returns the existing one (200) if a timer is already running.",
        requestBody: { content: { "application/json": { schema: startSessionSchema } } },
        responses: {
          "200": jsonResponse(
            "A timer was already running; it is returned unchanged.",
            sessionResponseSchema,
          ),
          "201": jsonResponse("Timer started.", sessionResponseSchema),
          "401": errorResponse("Unauthorized."),
          "404": errorResponse("Subject or Topic not found."),
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
      patch: {
        tags: sessionTags,
        summary: "Edit Subject or Topic, method, note, or (stopped records only) start and end",
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
  },
});
