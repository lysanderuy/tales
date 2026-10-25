"use client";

import { useUpdateProfile } from "@/hooks/use-profile";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";
import type { UpdateProfileInput } from "@/validators/profile.validator";

export function useSaveProfile(): (patch: UpdateProfileInput) => Promise<boolean> {
  const update = useUpdateProfile();
  const show = useToastStore((state) => state.show);
  const showError = useToastStore((state) => state.showError);

  return async (patch) => {
    try {
      await update.mutateAsync(patch);
      show(messages.settingsSaved);
      return true;
    } catch (failure) {
      showError(failure);
      return false;
    }
  };
}
