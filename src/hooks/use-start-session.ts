"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse, startSessionSchema } from "@/validators/study-session.validator";

export type StartSessionVariables = z.input<typeof startSessionSchema>;

export function useStartSession() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (input: StartSessionVariables) => api.post<SessionResponse>("/api/sessions", input),
    onSuccess: (session) => applySessionResult(queryClient, session),
    onError: showError,
  });
}
