"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

export function useDeleteAccount({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (password: string) => api.delete<{ deleted: true }>("/api/account", { password }),
    onError: toastOnError ? showError : undefined,
  });
}
