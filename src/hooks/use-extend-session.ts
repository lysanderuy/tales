"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse } from "@/validators/study-session.validator";

export interface ExtendSessionVariables {
  id: string;
  minutes: number;
}

export function useExtendSession() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, minutes }: ExtendSessionVariables) =>
      api.post<SessionResponse>(`/api/sessions/${id}/extend`, { minutes }),
    onSuccess: (session) => applySessionResult(queryClient, session),
    onError: showError,
  });
}
