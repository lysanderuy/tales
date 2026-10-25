"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidateEventData } from "@/hooks/use-events";
import { invalidatePlanData } from "@/hooks/use-plan-blocks";
import { sessionKeys } from "@/hooks/use-session";
import { invalidateSubjectData } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse, manualSessionSchema } from "@/validators/study-session.validator";

export type CreateRecordVariables = z.input<typeof manualSessionSchema>;

export function useCreateRecord({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (body: CreateRecordVariables) =>
      api.post<SessionResponse>("/api/sessions/manual", body),
    onError: toastOnError ? showError : undefined,
    onSettled: () => {
      invalidatePlanData(queryClient);
      invalidateSubjectData(queryClient);
      invalidateEventData(queryClient);
      void queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
