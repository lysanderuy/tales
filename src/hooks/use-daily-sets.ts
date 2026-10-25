"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import type { DailySetResponse } from "@/validators/daily-set.validator";

export const dailySetKeys = {
  all: ["daily-sets"] as const,
  list: ["daily-sets", "list"] as const,
  lines: (setId: string) => ["daily-sets", "lines", setId] as const,
};

export function invalidateDailySetData(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: dailySetKeys.all }),
    queryClient.invalidateQueries({ queryKey: todayKeys.all }),
  ]);
}

export function useDailySets() {
  return useQuery({
    queryKey: dailySetKeys.list,
    queryFn: () => api.get<DailySetResponse[]>("/api/daily-sets"),
  });
}
