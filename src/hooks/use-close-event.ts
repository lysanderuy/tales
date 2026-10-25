"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { invalidateEventData } from "@/hooks/use-events";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { EventDetailResponse, closeEventSchema } from "@/validators/event.validator";

export type CloseEventVariables = z.input<typeof closeEventSchema> & { id: string };

export function useCloseEvent({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, ...body }: CloseEventVariables) =>
      api.post<EventDetailResponse>(`/api/events/${id}/close`, body),
    onError: toastOnError ? showError : undefined,
    onSettled: () => invalidateEventData(queryClient),
  });
}
