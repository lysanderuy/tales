"use client";

import { useQuery } from "@tanstack/react-query";

import { subjectKeys } from "@/hooks/use-subjects";
import { api } from "@/lib/api/client";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export function useSubjectsWithTotals() {
  return useQuery({
    queryKey: subjectKeys.withTotals,
    queryFn: () =>
      api.get<OutlineNodeResponse[]>("/api/subjects?includeArchived=true&includeTotals=true"),
    staleTime: 30 * 1000,
  });
}
