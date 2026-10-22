"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSubjectData, subjectKeys } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import { applyMove } from "@/lib/subjects/optimistic";
import { useToastStore } from "@/stores/toast.store";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export type MoveSubjectVariables = { id: string; parentId: string | null; position?: number };

export function useMoveSubject() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, ...body }: MoveSubjectVariables) =>
      api.post<OutlineNodeResponse>(`/api/subjects/${id}/move`, body),
    onMutate: async ({ id, parentId, position }) => {
      await queryClient.cancelQueries({ queryKey: subjectKeys.all });
      const previous = queryClient.getQueriesData<OutlineNodeResponse[]>({
        queryKey: subjectKeys.all,
      });
      queryClient.setQueriesData<OutlineNodeResponse[]>({ queryKey: subjectKeys.all }, (nodes) =>
        nodes ? applyMove(nodes, id, parentId, position) : nodes,
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      showError(error);
    },
    onSettled: () => invalidateSubjectData(queryClient),
  });
}
