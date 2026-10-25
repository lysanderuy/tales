"use client";

import { useEffect } from "react";

import { useProfile } from "@/hooks/use-profile";

export function ThemeSync() {
  const theme = useProfile().data?.theme;

  useEffect(() => {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;
    document.cookie = `tales-theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme]);

  return null;
}
