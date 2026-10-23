"use client";

import { keepPreviousData, useQuery, type QueryClient, type QueryKey } from "@tanstack/react-query";

import { pickerKeys } from "@/hooks/use-picker";
import { planRecordKeys } from "@/hooks/use-plan-records";
import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import type { BlockResponse } from "@/validators/block.validator";

export const planBlockKeys = {
  all: ["plan", "blocks"] as const,
  range: (from: string, to: string) => ["plan", "blocks", from, to] as const,
};

export type PlanBlocksSnapshot = [QueryKey, BlockResponse[] | undefined][];

export function usePlanBlocks(from: string, to: string) {
  return useQuery({
    queryKey: planBlockKeys.range(from, to),
    queryFn: () => api.get<BlockResponse[]>(`/api/blocks?from=${from}&to=${to}&limit=500`),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function sortPlanBlocks(blocks: readonly BlockResponse[]): BlockResponse[] {
  return [...blocks].sort(
    (a, b) => a.date.localeCompare(b.date) || a.position - b.position || a.id.localeCompare(b.id),
  );
}

export async function applyPlanBlocks(
  queryClient: QueryClient,
  update: (blocks: BlockResponse[]) => BlockResponse[],
): Promise<PlanBlocksSnapshot> {
  await queryClient.cancelQueries({ queryKey: planBlockKeys.all });
  const snapshot = queryClient.getQueriesData<BlockResponse[]>({ queryKey: planBlockKeys.all });
  queryClient.setQueriesData<BlockResponse[]>({ queryKey: planBlockKeys.all }, (blocks) =>
    blocks ? update(blocks) : blocks,
  );
  return snapshot;
}

export function restorePlanBlocks(
  queryClient: QueryClient,
  snapshot: PlanBlocksSnapshot | undefined,
): void {
  for (const [key, blocks] of snapshot ?? []) queryClient.setQueryData(key, blocks);
}

export function invalidatePlanData(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: planBlockKeys.all });
  void queryClient.invalidateQueries({ queryKey: planRecordKeys.all });
  void queryClient.invalidateQueries({ queryKey: todayKeys.all });
  void queryClient.invalidateQueries({ queryKey: pickerKeys.all });
}
