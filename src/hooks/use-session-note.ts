"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useUpdateSession } from "@/hooks/use-update-session";

const SAVE_DELAY_MS = 600;

export interface SessionNote {
  text: string;
  setText: (value: string) => void;
  flush: () => Promise<void>;
}

function ignore(): void {}

export function useSessionNote(sessionId: string, saved: string | null): SessionNote {
  const [text, setTextState] = useState(saved ?? "");
  const { mutateAsync } = useUpdateSession();
  const latest = useRef(text);
  const persisted = useRef(saved ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const value = latest.current;
    if (value === persisted.current) return;
    await mutateAsync({ id: sessionId, note: value.trim() === "" ? null : value });
    persisted.current = value;
  }, [mutateAsync, sessionId]);

  const setText = useCallback(
    (value: string) => {
      latest.current = value;
      setTextState(value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => flush().catch(ignore), SAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(
    () => () => {
      flush().catch(ignore);
    },
    [flush],
  );

  return { text, setText, flush };
}
