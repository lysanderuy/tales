"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { PickerResponse } from "@/validators/today.validator";

export const pickerKeys = {
  all: ["picker"] as const,
  search: (q: string) => ["picker", { q }] as const,
};

export function usePicker(q: string) {
  return useQuery({
    queryKey: pickerKeys.search(q),
    queryFn: () =>
      api.get<PickerResponse>(q ? `/api/picker?q=${encodeURIComponent(q)}` : "/api/picker"),
    placeholderData: keepPreviousData,
  });
}
