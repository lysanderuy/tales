"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateEventData } from "@/hooks/use-events";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteEvent({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/events/${id}`),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateEventData(queryClient),
  });
}
