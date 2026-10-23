"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { dayRangeUtc } from "@/lib/time/zone";
import type { SessionResponse } from "@/validators/study-session.validator";

export const planRecordKeys = {
  all: ["sessions", "plan"] as const,
  range: (from: string, to: string, timeZone: string) =>
    ["sessions", "plan", from, to, timeZone] as const,
};

export function usePlanRecords(from: string, to: string, timeZone: string) {
  return useQuery({
    queryKey: planRecordKeys.range(from, to, timeZone),
    queryFn: () => {
      const start = dayRangeUtc(from, timeZone).start.toISOString();
      const end = dayRangeUtc(to, timeZone).end.toISOString();
      return api.get<SessionResponse[]>(
        `/api/sessions?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}&limit=500`,
      );
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
