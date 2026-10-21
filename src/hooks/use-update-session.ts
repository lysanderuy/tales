"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { SessionResponse, updateSessionSchema } from "@/validators/study-session.validator";

export type UpdateSessionVariables = { id: string } & z.input<typeof updateSessionSchema>;

export function useUpdateSession({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateSessionVariables) =>
      api.patch<SessionResponse>(`/api/sessions/${id}`, body),
    onSuccess: (session) => applySessionResult(queryClient, session),
    onError: toastOnError ? showError : undefined,
  });
}
