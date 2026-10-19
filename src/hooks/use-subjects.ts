"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export const subjectKeys = {
  all: ["subjects"] as const,
  withArchived: ["subjects", { includeArchived: true }] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.withArchived,
    queryFn: () => api.get<OutlineNodeResponse[]>("/api/subjects?includeArchived=true"),
    staleTime: 60 * 1000,
  });
}
