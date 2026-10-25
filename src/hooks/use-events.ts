"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import type { EventListResponse } from "@/validators/event.validator";

export const eventKeys = {
  all: ["events"] as const,
  list: ["events", "list"] as const,
  detail: (id: string) => ["events", "detail", id] as const,
};

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list,
    queryFn: () => api.get<EventListResponse>("/api/events"),
    staleTime: 30 * 1000,
  });
}

export function invalidateEventData(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: eventKeys.all });
  void queryClient.invalidateQueries({ queryKey: todayKeys.all });
}
