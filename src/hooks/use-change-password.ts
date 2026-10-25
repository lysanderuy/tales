"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { ChangePasswordInput } from "@/validators/account.validator";

export function useChangePassword({ toastOnError = true }: { toastOnError?: boolean } = {}) {
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api.patch<{ changed: true }>("/api/account/password", input),
    onError: toastOnError ? showError : undefined,
  });
}
