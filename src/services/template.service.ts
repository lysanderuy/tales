import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { owned } from "@/db/owned";
import { templateItems, templates, type Template, type TemplateItem } from "@/db/schema";
import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { createMany, loadDay, type Tx } from "@/services/block.service";
import type { PlannedAddedResponse } from "@/validators/plan-copy.validator";
import type {
  ApplyTemplateInput,
  CreateTemplateInput,
  RenameTemplateInput,
  TemplateResponse,
} from "@/validators/template.validator";

type Executor = Tx | typeof db;

function toResponse(row: Template, items: readonly TemplateItem[]): TemplateResponse {
  return {
    id: row.id,
    name: row.name,
    items: items.map((item) => ({
      nodeId: item.nodeId,
      timeOfDay: item.timeOfDay ? item.timeOfDay.slice(0, 5) : null,
      plannedMinutes: item.plannedMinutes,
      position: item.position,
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadItems(
  executor: Executor,
  userId: string,
  templateIds: string[],
): Promise<TemplateItem[]> {
  if (templateIds.length === 0) return [];
  return executor
    .select()
    .from(templateItems)
    .where(owned(templateItems, userId, inArray(templateItems.templateId, templateIds)))
    .orderBy(asc(templateItems.position), asc(templateItems.id));
}

export const templateService = {
  async list(userId: string): Promise<TemplateResponse[]> {
    const rows = await db
      .select()
      .from(templates)
      .where(owned(templates, userId))
      .orderBy(desc(templates.createdAt), asc(templates.id));
    const items = await loadItems(
      db,
      userId,
      rows.map((row) => row.id),
    );
    return rows.map((row) =>
      toResponse(
        row,
        items.filter((item) => item.templateId === row.id),
      ),
    );
  },

  async createFromDay(userId: string, input: CreateTemplateInput): Promise<TemplateResponse> {
    return db.transaction(async (tx) => {
      const day = await loadDay(tx, userId, input.fromDate);
      if (day.length === 0) throw new AppError(422, messages.templateNothingToSave);
      const [created] = await tx.insert(templates).values({ userId, name: input.name }).returning();
      const items = await tx
        .insert(templateItems)
        .values(
          day.map((block, index) => ({
            userId,
            templateId: created.id,
            nodeId: block.nodeId,
            timeOfDay: block.timeOfDay,
            plannedMinutes: block.plannedMinutes,
            position: index,
          })),
        )
        .returning();
      return toResponse(
        created,
        items.sort((a, b) => a.position - b.position),
      );
    });
  },

  async rename(userId: string, id: string, input: RenameTemplateInput): Promise<TemplateResponse> {
    const [row] = await db
      .update(templates)
      .set({ name: input.name, updatedAt: new Date() })
      .where(owned(templates, userId, eq(templates.id, id)))
      .returning();
    if (!row) throw new AppError(404, messages.notFound);
    return toResponse(row, await loadItems(db, userId, [row.id]));
  },

  async remove(userId: string, id: string): Promise<void> {
    const [deleted] = await db
      .delete(templates)
      .where(owned(templates, userId, eq(templates.id, id)))
      .returning({ id: templates.id });
    if (!deleted) throw new AppError(404, messages.notFound);
  },

  async apply(
    userId: string,
    id: string,
    input: ApplyTemplateInput,
  ): Promise<PlannedAddedResponse> {
    return db.transaction(async (tx) => {
      const [template] = await tx
        .select({ id: templates.id })
        .from(templates)
        .where(owned(templates, userId, eq(templates.id, id)));
      if (!template) throw new AppError(404, messages.notFound);
      const items = await loadItems(tx, userId, [id]);
      if (input.preview) return { added: items.length };
      const added = await createMany(
        tx,
        userId,
        items.map((item) => ({
          nodeId: item.nodeId,
          date: input.date,
          timeOfDay: item.timeOfDay,
          plannedMinutes: item.plannedMinutes,
        })),
      );
      return { added };
    });
  },
};
