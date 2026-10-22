"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSubjectData } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export type UpdateSubjectVariables = {
  id: string;
  name?: string;
  examWeight?: number | null;
  archived?: boolean;
};

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSubjectVariables) =>
      api.patch<OutlineNodeResponse>(`/api/subjects/${id}`, body),
    onError: showError,
    onSettled: () => invalidateSubjectData(queryClient),
  });
}
