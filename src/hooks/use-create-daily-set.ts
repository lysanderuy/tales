"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDailySetData } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { DailySetResponse } from "@/validators/daily-set.validator";

export function useCreateDailySet({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (name: string) => api.post<DailySetResponse>("/api/daily-sets", { name }),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateDailySetData(queryClient),
  });
}
