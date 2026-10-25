"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import { useUiStore } from "@/stores/ui.store";
import type { CurrentSessionResponse, SessionResponse } from "@/validators/study-session.validator";

export const currentSessionKeys = {
  all: ["sessions", "current"] as const,
};

export function useCurrentSession() {
  return useQuery({
    queryKey: currentSessionKeys.all,
    queryFn: () => api.get<CurrentSessionResponse>("/api/sessions/current"),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export const justStoppedKey = ["sessions", "just-stopped"] as const;

export function setJustStopped(queryClient: QueryClient, session: SessionResponse | null): void {
  queryClient.setQueryData<SessionResponse | null>(justStoppedKey, session);
}

export function useEndRecord(): SessionResponse | null {
  const { data } = useCurrentSession();
  const { data: justStopped = null } = useQuery<SessionResponse | null>({
    queryKey: justStoppedKey,
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });
  return data?.session?.state === "stopped" ? data.session : justStopped;
}

export function useStaleSession(): SessionResponse | null {
  const { data } = useCurrentSession();
  const handledId = useUiStore((state) => state.staleHandledId);
  const session = data?.session;
  return session && session.state === "running" && session.stale && session.id !== handledId
    ? session
    : null;
}

// Mutation responses carry no server clock, so reuse the offset of the data already cached.
export function writeCurrentSession(queryClient: QueryClient, session: SessionResponse): void {
  const state = queryClient.getQueryState<CurrentSessionResponse>(currentSessionKeys.all);
  const offset = state?.data ? Date.parse(state.data.serverNow) - state.dataUpdatedAt : 0;
  const keep = session.state !== "stopped" || session.pending;

  if (!keep && state?.data?.session?.id !== session.id) return;

  queryClient.setQueryData<CurrentSessionResponse>(currentSessionKeys.all, {
    session: keep ? session : null,
    serverNow: new Date(Date.now() + offset).toISOString(),
  });
}

export function applySessionResult(queryClient: QueryClient, session: SessionResponse): void {
  writeCurrentSession(queryClient, session);
  void queryClient.invalidateQueries({ queryKey: currentSessionKeys.all });
  void queryClient.invalidateQueries({ queryKey: todayKeys.all });
}
