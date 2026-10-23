"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidatePlanData } from "@/hooks/use-plan-blocks";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { BlockResponse, createBlockSchema } from "@/validators/block.validator";

export type CreateBlockVariables = z.input<typeof createBlockSchema>;

export function useCreateBlock({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (body: CreateBlockVariables) => api.post<BlockResponse>("/api/blocks", body),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidatePlanData(queryClient),
  });
}
