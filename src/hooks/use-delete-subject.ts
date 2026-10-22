"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSubjectData } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: true }>(`/api/subjects/${id}`),
    onSuccess: () => invalidateSubjectData(queryClient),
    onError: showError,
  });
}
