"use client";

import { useQuery } from "@tanstack/react-query";

import { eventKeys } from "@/hooks/use-events";
import { api } from "@/lib/api/client";
import type { EventDetailResponse } from "@/validators/event.validator";

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => api.get<EventDetailResponse>(`/api/events/${id}`),
  });
}
