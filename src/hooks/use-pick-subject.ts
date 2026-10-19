"use client";

import { useCallback } from "react";

import { useUpdateSession } from "@/hooks/use-update-session";

export function usePickSubject(
  sessionId: string,
): (nodeId: string, blockId: string | null) => void {
  const { mutate } = useUpdateSession();
  return useCallback(
    (nodeId, blockId) => mutate(blockId ? { id: sessionId, blockId } : { id: sessionId, nodeId }),
    [mutate, sessionId],
  );
}
