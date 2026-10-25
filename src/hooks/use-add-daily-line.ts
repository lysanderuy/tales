"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDailySetData } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { DailyLineResponse } from "@/validators/daily-set.validator";

export function useAddDailyLine({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ setId, text }: { setId: string; text: string }) =>
      api.post<DailyLineResponse>(`/api/daily-sets/${setId}/lines`, { text }),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateDailySetData(queryClient),
  });
}
