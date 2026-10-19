"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse } from "@/validators/study-session.validator";

export function useResumeSession() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (id: string) => api.post<SessionResponse>(`/api/sessions/${id}/resume`, {}),
    onSuccess: (session) => applySessionResult(queryClient, session),
    onError: showError,
  });
}
