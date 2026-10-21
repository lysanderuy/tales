"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { SessionResponse } from "@/validators/study-session.validator";

export const sessionKeys = {
  all: ["sessions", "detail"] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
};

export function useSession(id: string | null) {
  return useQuery({
    queryKey: sessionKeys.detail(id ?? ""),
    queryFn: () => api.get<SessionResponse>(`/api/sessions/${id}`),
    enabled: id !== null,
    staleTime: 0,
  });
}
