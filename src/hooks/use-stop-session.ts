"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applySessionResult, setJustStopped } from "@/hooks/use-current-session";
import { invalidateEventData } from "@/hooks/use-events";
import { invalidatePlanData } from "@/hooks/use-plan-blocks";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse } from "@/validators/study-session.validator";

export interface StopSessionVariables {
  id: string;
  endedAt?: string;
}

export function useStopSession() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, endedAt }: StopSessionVariables) =>
      api.post<SessionResponse>(`/api/sessions/${id}/stop`, endedAt ? { endedAt } : {}),
    onSuccess: (session) => {
      applySessionResult(queryClient, session);
      invalidatePlanData(queryClient);
      invalidateEventData(queryClient);
      setJustStopped(queryClient, session);
    },
    onError: showError,
  });
}
