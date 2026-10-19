"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";

import { applySessionResult } from "@/hooks/use-current-session";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { startBlockSchema } from "@/validators/block.validator";
import type { SessionResponse } from "@/validators/study-session.validator";

export type StartBlockVariables = z.input<typeof startBlockSchema> & { blockId: string };

export function useStartBlock() {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ blockId, ...body }: StartBlockVariables) =>
      api.post<SessionResponse>(`/api/blocks/${blockId}/start`, body),
    onSuccess: (session) => applySessionResult(queryClient, session),
    onError: showError,
  });
}
