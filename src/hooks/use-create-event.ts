"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidateEventData } from "@/hooks/use-events";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { EventDetailResponse, createEventSchema } from "@/validators/event.validator";

export type CreateEventVariables = z.input<typeof createEventSchema>;

export function useCreateEvent({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (body: CreateEventVariables) => api.post<EventDetailResponse>("/api/events", body),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateEventData(queryClient),
  });
}
