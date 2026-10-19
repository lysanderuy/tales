"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { currentSessionKeys } from "@/hooks/use-current-session";
import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/sessions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: currentSessionKeys.all });
      void queryClient.invalidateQueries({ queryKey: todayKeys.all });
    },
    onError: showError,
  });
}
