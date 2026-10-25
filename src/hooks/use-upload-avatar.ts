"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileKeys } from "@/hooks/use-profile";
import type { Profile } from "@/db/schema";
import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useUploadAvatar({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.upload<Profile>("/api/profile/avatar", form);
    },
    onError: toastOnError ? showError : undefined,
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  });
}
