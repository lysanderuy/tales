import { create } from "zustand";

import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/messages";

const CLEAR_AFTER_MS = 3000;

const friendlyMessages = new Set<string>(
  Object.values<unknown>(messages).filter((value): value is string => typeof value === "string"),
);

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  showError: (error: unknown) => void;
}

let clearTimer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  show: (message) => {
    clearTimeout(clearTimer);
    set({ message });
    clearTimer = setTimeout(() => set({ message: null }), CLEAR_AFTER_MS);
  },
  // The API sends user-facing text only for known messages; anything else is technical.
  showError: (error) => {
    const known = error instanceof ApiError && friendlyMessages.has(error.message);
    get().show(known ? error.message : messages.serverError);
  },
}));
