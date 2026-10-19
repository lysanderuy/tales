"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { writeCurrentSession } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import type { SessionResponse } from "@/validators/study-session.validator";

export function useHeartbeatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<SessionResponse>(`/api/sessions/${id}/heartbeat`, {}),
    onSuccess: (session) => writeCurrentSession(queryClient, session),
  });
}
