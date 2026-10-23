"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { EventListResponse } from "@/validators/event.validator";

export const planEventKeys = {
  all: ["events", "plan"] as const,
  range: (from: string, to: string) => ["events", "plan", from, to] as const,
};

export function usePlanEvents(from: string, to: string) {
  return useQuery({
    queryKey: planEventKeys.range(from, to),
    queryFn: () => api.get<EventListResponse>(`/api/events?from=${from}&to=${to}`),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
