"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidateEventData } from "@/hooks/use-events";
import {
  applyPlanBlocks,
  invalidatePlanData,
  restorePlanBlocks,
  type PlanBlocksSnapshot,
} from "@/hooks/use-plan-blocks";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { BlockResponse, updateBlockSchema } from "@/validators/block.validator";

export type UpdateBlockVariables = z.input<typeof updateBlockSchema> & { id: string };

function applyPatch(
  blocks: BlockResponse[],
  { id, ...patch }: UpdateBlockVariables,
): BlockResponse[] {
  const current = blocks.find((block) => block.id === id);
  if (!current) return blocks;
  const moved = patch.date !== undefined && patch.date !== current.date;
  const lastPosition = moved
    ? blocks.filter((block) => block.date === patch.date).length
    : current.position;

  return blocks.map((block) =>
    block.id === id
      ? {
          ...block,
          nodeId: patch.nodeId ?? block.nodeId,
          date: patch.date ?? block.date,
          timeOfDay: patch.timeOfDay === undefined ? block.timeOfDay : patch.timeOfDay,
          plannedMinutes:
            patch.plannedMinutes === undefined ? block.plannedMinutes : patch.plannedMinutes,
          eventId: patch.eventId === undefined ? block.eventId : patch.eventId,
          position: patch.position ?? lastPosition,
        }
      : block,
  );
}

export function useUpdateBlock({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation<BlockResponse, unknown, UpdateBlockVariables, PlanBlocksSnapshot>({
    mutationFn: ({ id, ...body }) => api.patch<BlockResponse>(`/api/blocks/${id}`, body),
    onMutate: (variables) =>
      applyPlanBlocks(queryClient, (blocks) => applyPatch(blocks, variables)),
    onError: (error, _variables, snapshot) => {
      restorePlanBlocks(queryClient, snapshot);
      if (toastOnError) showError(error);
    },
    onSettled: (_data, _error, variables) => {
      invalidatePlanData(queryClient);
      if (variables.eventId !== undefined) invalidateEventData(queryClient);
    },
  });
}
