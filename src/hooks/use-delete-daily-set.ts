"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDailySetData } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteDailySet({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/daily-sets/${id}`),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateDailySetData(queryClient),
  });
}
