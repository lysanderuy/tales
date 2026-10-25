"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidateEventData } from "@/hooks/use-events";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { EventDetailResponse, updateEventSchema } from "@/validators/event.validator";

export type UpdateEventVariables = z.input<typeof updateEventSchema> & { id: string };

export function useUpdateEvent({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateEventVariables) =>
      api.patch<EventDetailResponse>(`/api/events/${id}`, patch),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateEventData(queryClient),
  });
}
