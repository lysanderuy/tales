"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { currentSessionKeys } from "@/hooks/use-current-session";
import { invalidatePlanData } from "@/hooks/use-plan-blocks";
import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteSession({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/sessions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: currentSessionKeys.all });
      void queryClient.invalidateQueries({ queryKey: todayKeys.all });
      invalidatePlanData(queryClient);
    },
    onError: toastOnError ? showError : undefined,
  });
}
