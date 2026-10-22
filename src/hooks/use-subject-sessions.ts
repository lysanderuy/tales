"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { SessionResponse } from "@/validators/study-session.validator";

export const subjectSessionKeys = {
  all: ["sessions", "subject"] as const,
  node: (nodeId: string) => ["sessions", "subject", nodeId] as const,
};

export function useSubjectSessions(nodeId: string) {
  return useQuery({
    queryKey: subjectSessionKeys.node(nodeId),
    queryFn: () => api.get<SessionResponse[]>(`/api/sessions?nodeId=${nodeId}`),
    staleTime: 0,
  });
}
