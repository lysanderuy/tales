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
  },
});
