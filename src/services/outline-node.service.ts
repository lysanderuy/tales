import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { lockUser, owned } from "@/db/owned";
import { outlineNodes, type OutlineNode } from "@/db/schema";
import { AppError, mapDbError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { isDescendant, nextColorIndex, orderedRows, rollUp } from "@/lib/outline/tree";
import { studySessionService, type NodeTotals } from "@/services/study-session.service";
import type {
  CreateOutlineNodeInput,
  MoveOutlineNodeInput,
  OutlineNodeResponse,
  ReorderOutlineNodesInput,
  UpdateOutlineNodeInput,
} from "@/validators/outline-node.validator";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function isConflict(error: unknown, message: string): boolean {
  return mapDbError(error)?.message === message;
}

function nameClashToConflict(error: unknown): never {
  if (isConflict(error, messages.conflictDuplicate)) {
    throw new AppError(409, messages.nodeNameTaken);
  }
  throw error;
}

async function loadAll(tx: Tx, userId: string): Promise<OutlineNode[]> {
  return tx.select().from(outlineNodes).where(owned(outlineNodes, userId));
}

function annotate(rows: OutlineNode[]): OutlineNodeResponse[] {
  const byId = new Map<string, OutlineNodeResponse>();
  const out: OutlineNodeResponse[] = [];
  for (const row of orderedRows(rows)) {
    const parent = row.parentId ? byId.get(row.parentId) : undefined;
    const node: OutlineNodeResponse = {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      position: row.position,
      examWeight: row.examWeight === null ? null : Number(row.examWeight),
      archived: row.archived,
      effectivelyArchived: row.archived || (parent?.effectivelyArchived ?? false),
      colorIndex: parent ? parent.colorIndex : (row.colorIndex ?? 0),
      path: [...(parent?.path ?? []), row.name],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
    byId.set(row.id, node);
    out.push(node);
  }
  return out;
}

async function loadOne(tx: Tx, userId: string, id: string): Promise<OutlineNodeResponse> {
  const found = annotate(await loadAll(tx, userId)).find((node) => node.id === id);
  if (!found) throw new AppError(404, messages.notFound);
  return found;
}

function childrenOf(rows: OutlineNode[], parentId: string | null): OutlineNode[] {
  return rows.filter((row) => row.parentId === parentId).sort((a, b) => a.position - b.position);
}

async function renumber(tx: Tx, userId: string, ordered: OutlineNode[]): Promise<void> {
  for (const [index, row] of ordered.entries()) {
    if (row.position === index) continue;
    await tx
      .update(outlineNodes)
      .set({ position: index, updatedAt: new Date() })
      .where(owned(outlineNodes, userId, eq(outlineNodes.id, row.id)));
  }
}

function usedRootColors(rows: OutlineNode[], exceptId?: string): number[] {
  return rows
    .filter((row) => row.parentId === null && row.id !== exceptId && row.colorIndex !== null)
    .map((row) => row.colorIndex as number);
}

function secondsAndLast(totals: Map<string, NodeTotals>) {
  const seconds = new Map<string, number>();
  const last = new Map<string, Date>();
  for (const [nodeId, value] of totals) {
    seconds.set(nodeId, value.seconds);
    last.set(nodeId, value.lastStartedAt);
  }
  return { seconds, last };
}

async function withTotals(
  userId: string,
  rows: OutlineNode[],
  nodes: OutlineNodeResponse[],
): Promise<OutlineNodeResponse[]> {
  const now = new Date();
  const recentFrom = await studySessionService.recentWindowStart(userId, now, 7);
  const [allTime, recent] = await Promise.all([
    studySessionService.totalsByNode(userId),
    studySessionService.totalsByNode(userId, { from: recentFrom }),
  ]);
  const all = secondsAndLast(allTime);
  const recentSeconds = secondsAndLast(recent);
  const rolledAll = rollUp(rows, all.seconds, all.last);
  const rolledRecent = rollUp(rows, recentSeconds.seconds, recentSeconds.last);

  return nodes.map((node) => {
    const total = rolledAll.get(node.id);
    return {
      ...node,
      totals: {
        totalSeconds: total?.totalSeconds ?? 0,
        ownSeconds: total?.ownSeconds ?? 0,
        last7DaysSeconds: rolledRecent.get(node.id)?.totalSeconds ?? 0,
        lastStudiedAt: total?.lastStudiedAt?.toISOString() ?? null,
      },
    };
  });
}

export const outlineNodeService = {
  async list(
    userId: string,
    { includeArchived, includeTotals }: { includeArchived: boolean; includeTotals: boolean },
  ): Promise<OutlineNodeResponse[]> {
    const rows = await db.select().from(outlineNodes).where(owned(outlineNodes, userId));
    const annotated = annotate(rows);
    const visible = includeArchived
      ? annotated
      : annotated.filter((node) => !node.effectivelyArchived);
    return includeTotals ? withTotals(userId, rows, visible) : visible;
  },

  async create(userId: string, input: CreateOutlineNodeInput): Promise<OutlineNodeResponse> {
    return db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const rows = await loadAll(tx, userId);
      const parentId = input.parentId ?? null;
      if (parentId !== null && !rows.some((row) => row.id === parentId)) {
        throw new AppError(404, messages.notFound);
      }

      try {
        const [created] = await tx
          .insert(outlineNodes)
          .values({
            userId,
            parentId,
            name: input.name,
            position: Math.max(-1, ...childrenOf(rows, parentId).map((row) => row.position)) + 1,
            examWeight: input.examWeight === undefined ? null : String(input.examWeight),
            colorIndex: parentId === null ? nextColorIndex(usedRootColors(rows)) : null,
          })
          .returning({ id: outlineNodes.id });
        return await loadOne(tx, userId, created.id);
      } catch (error) {
        return nameClashToConflict(error);
      }
    });
  },

  async update(
    userId: string,
    id: string,
    input: UpdateOutlineNodeInput,
  ): Promise<OutlineNodeResponse> {
    return db.transaction(async (tx) => {
      try {
        const [updated] = await tx
          .update(outlineNodes)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.examWeight !== undefined && {
              examWeight: input.examWeight === null ? null : String(input.examWeight),
            }),
            ...(input.archived !== undefined && { archived: input.archived }),
            updatedAt: new Date(),
          })
          .where(owned(outlineNodes, userId, eq(outlineNodes.id, id)))
          .returning({ id: outlineNodes.id });
        if (!updated) throw new AppError(404, messages.notFound);
        return await loadOne(tx, userId, id);
      } catch (error) {
        if (error instanceof AppError) throw error;
        return nameClashToConflict(error);
      }
    });
  },

  async move(
    userId: string,
    id: string,
    input: MoveOutlineNodeInput,
  ): Promise<OutlineNodeResponse> {
    return db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const rows = await loadAll(tx, userId);
      const node = rows.find((row) => row.id === id);
      if (!node) throw new AppError(404, messages.notFound);

      const targetId = input.parentId;
      if (targetId !== null) {
        if (!rows.some((row) => row.id === targetId)) throw new AppError(404, messages.notFound);
        if (targetId === id || isDescendant(rows, id, targetId)) {
          throw new AppError(422, messages.nodeMoveIntoSelf);
        }
      }

      const siblings = childrenOf(rows, targetId).filter((row) => row.id !== id);
      const index = Math.min(input.position ?? siblings.length, siblings.length);
      const becomesSubject = targetId === null && node.parentId !== null;
      const colorIndex =
        targetId !== null
          ? null
          : becomesSubject || node.colorIndex === null
            ? nextColorIndex(usedRootColors(rows, id))
            : node.colorIndex;

      try {
        await tx
          .update(outlineNodes)
          .set({ parentId: targetId, position: index, colorIndex, updatedAt: new Date() })
          .where(owned(outlineNodes, userId, eq(outlineNodes.id, id)));
      } catch (error) {
        return nameClashToConflict(error);
      }

      const reordered = [...siblings];
      reordered.splice(index, 0, { ...node, position: index });
      await renumber(tx, userId, reordered);
      if (node.parentId !== targetId) {
        await renumber(
          tx,
          userId,
          childrenOf(rows, node.parentId).filter((row) => row.id !== id),
        );
      }

      return loadOne(tx, userId, id);
    });
  },

  async reorder(userId: string, input: ReorderOutlineNodesInput): Promise<OutlineNodeResponse[]> {
    return db.transaction(async (tx) => {
      await lockUser(tx, userId);
      const rows = await loadAll(tx, userId);
      if (input.parentId !== null && !rows.some((row) => row.id === input.parentId)) {
        throw new AppError(404, messages.notFound);
      }

      const current = childrenOf(rows, input.parentId);
      const byId = new Map(current.map((row) => [row.id, row]));
      if (
        current.length !== input.orderedIds.length ||
        !input.orderedIds.every((orderedId) => byId.has(orderedId))
      ) {
        throw new AppError(422, messages.nodeReorderMismatch);
      }

      await renumber(
        tx,
        userId,
        input.orderedIds.map((orderedId) => byId.get(orderedId)!),
      );

      const wanted = new Set(input.orderedIds);
      return annotate(await loadAll(tx, userId))
        .filter((node) => wanted.has(node.id))
        .sort((a, b) => a.position - b.position);
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        const [deleted] = await tx
          .delete(outlineNodes)
          .where(owned(outlineNodes, userId, eq(outlineNodes.id, id)))
          .returning({ id: outlineNodes.id });
        if (!deleted) throw new AppError(404, messages.notFound);
      });
    } catch (error) {
      if (isConflict(error, messages.conflictReference)) {
        throw new AppError(409, messages.nodeHasRecords);
      }
      throw error;
    }
  },
};
