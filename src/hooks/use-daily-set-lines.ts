"use client";

import { useQuery } from "@tanstack/react-query";

import { dailySetKeys } from "@/hooks/use-daily-sets";
import { api } from "@/lib/api/client";
import type { DailyLineResponse } from "@/validators/daily-set.validator";

export function useDailySetLines(setId: string) {
  return useQuery({
    queryKey: dailySetKeys.lines(setId),
    queryFn: () => api.get<DailyLineResponse[]>(`/api/daily-sets/${setId}/lines`),
  });
}
