"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";
import type { ProfileResponse, UpdateProfileInput } from "@/validators/profile.validator";

export const profileKeys = {
  me: ["profile", "me"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => api.get<ProfileResponse>("/api/profile"),
  });
}

export function useUpdateProfile({ toastOnError = false }: { toastOnError?: boolean } = {}) {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.patch<ProfileResponse>("/api/profile", input),
    onMutate: async (input) => {
      const previous = queryClient.getQueryData<ProfileResponse>(profileKeys.me);
      if (input.theme && previous) {
        await queryClient.cancelQueries({ queryKey: profileKeys.me });
        queryClient.setQueryData<ProfileResponse>(profileKeys.me, {
          ...previous,
          theme: input.theme,
        });
      }
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(profileKeys.me, context.previous);
      if (toastOnError) showError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  });
}
