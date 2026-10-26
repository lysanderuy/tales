"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import type { NextUpResponse } from "@/validators/today.validator";

export const nextUpKey = (excludeBlockId: string | null) =>
  [...todayKeys.all, "next-up", excludeBlockId] as const;

export function useNextUp(excludeBlockId: string | null) {
  return useQuery({
    queryKey: nextUpKey(excludeBlockId),
    queryFn: () =>
      api.get<NextUpResponse>(
        excludeBlockId
          ? `/api/today/next-up?excludeBlockId=${encodeURIComponent(excludeBlockId)}`
          : "/api/today/next-up",
      ),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
