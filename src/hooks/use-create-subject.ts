"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSubjectData } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export type CreateSubjectVariables = { name: string; parentId?: string };

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (input: CreateSubjectVariables) =>
      api.post<OutlineNodeResponse>("/api/subjects", input),
    onSuccess: () => invalidateSubjectData(queryClient),
    onError: showError,
  });
}
