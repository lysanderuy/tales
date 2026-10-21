"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import { useUiStore } from "@/stores/ui.store";
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
      useUiStore.getState().setJustStopped(session);
    },
    onError: showError,
  });
}
