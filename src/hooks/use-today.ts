"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { TodayResponse } from "@/validators/today.validator";

export const todayKeys = {
  all: ["today"] as const,
};

export function useToday() {
  return useQuery({
    queryKey: todayKeys.all,
    queryFn: () => api.get<TodayResponse>("/api/today"),
    staleTime: 30 * 1000,
  });
}
