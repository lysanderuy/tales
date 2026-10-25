"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateDailySetData } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { BulkDailyLinesResponse } from "@/validators/daily-set.validator";

type BulkVariables = { setId: string; text: string; preview?: boolean };

export function useBulkDailyLines({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ setId, text, preview }: BulkVariables) =>
      api.post<BulkDailyLinesResponse>(`/api/daily-sets/${setId}/lines/bulk`, { text, preview }),
    onError: toastOnError ? showError : undefined,
    onSettled: (_data, _error, variables) =>
      variables.preview ? undefined : invalidateDailySetData(queryClient),
  });
}
