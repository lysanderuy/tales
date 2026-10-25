"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ProfileResponse } from "@/validators/profile.validator";
import { profileKeys } from "@/hooks/use-profile";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useRemoveAvatar({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: () => api.delete<ProfileResponse>("/api/profile/avatar"),
    onError: toastOnError ? showError : undefined,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  });
}
