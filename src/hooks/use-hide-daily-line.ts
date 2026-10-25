"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDailySetData } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useHideDailyLine({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, hide }: { id: string; hide: boolean }) =>
      api.post<unknown>(`/api/daily-lines/${id}/${hide ? "hide" : "unhide"}`),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateDailySetData(queryClient),
  });
}
