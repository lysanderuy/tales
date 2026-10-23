"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidatePlanData } from "@/hooks/use-plan-blocks";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteBlock({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/blocks/${id}`),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidatePlanData(queryClient),
  });
}
