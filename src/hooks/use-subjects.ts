"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { pickerKeys } from "@/hooks/use-picker";
import { subjectSessionKeys } from "@/hooks/use-subject-sessions";
import { todayKeys } from "@/hooks/use-today";
import { api } from "@/lib/api/client";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export const subjectKeys = {
  all: ["subjects"] as const,
  withArchived: ["subjects", { includeArchived: true }] as const,
  withTotals: ["subjects", { includeArchived: true, includeTotals: true }] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.withArchived,
    queryFn: () => api.get<OutlineNodeResponse[]>("/api/subjects?includeArchived=true"),
    staleTime: 60 * 1000,
  });
}

export function invalidateSubjectData(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
  void queryClient.invalidateQueries({ queryKey: subjectSessionKeys.all });
  void queryClient.invalidateQueries({ queryKey: todayKeys.all });
  void queryClient.invalidateQueries({ queryKey: pickerKeys.all });
}
