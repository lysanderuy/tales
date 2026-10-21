"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useCountdownChime } from "@/hooks/use-countdown-chime";
import { currentSessionKeys } from "@/hooks/use-current-session";
import { useHeartbeatSession } from "@/hooks/use-heartbeat-session";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useSubjects } from "@/hooks/use-subjects";
import { messages } from "@/lib/messages";
import { clockOffset, tabTitle } from "@/lib/timer/clock";
import { decideHeartbeat } from "@/lib/timer/heartbeat";
import { buildSubjectIndex } from "@/lib/today/subject-index";
import { useUiStore } from "@/stores/ui.store";
import type { CurrentSessionResponse } from "@/validators/study-session.validator";

const HEARTBEAT_MS = 60_000;

export function TimerEffects() {
  const { session, display } = useSessionClock();
  const subjects = useSubjects();
  const queryClient = useQueryClient();
  const { mutate: sendHeartbeat } = useHeartbeatSession();
  useCountdownChime();

  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);
  const subjectName = session?.nodeId ? (index.get(session.nodeId)?.name ?? null) : null;
  const title = tabTitle(session, display, subjectName);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(
    () => () => {
      document.title = messages.appName;
    },
    [],
  );

  const heartbeatId = session?.state === "running" ? session.id : null;

  useEffect(() => {
    if (!heartbeatId) return;

    const beat = () => {
      const state = queryClient.getQueryState<CurrentSessionResponse>(currentSessionKeys.all);
      const current = state?.data?.session;
      if (!state?.data || !current || current.id !== heartbeatId) return;

      const decision = decideHeartbeat({
        handled: useUiStore.getState().staleHandledId === current.id,
        stale: current.stale,
        lastHeartbeatMs: Date.parse(current.lastHeartbeatAt),
        serverNowMs: Date.now() + clockOffset(state.data.serverNow, state.dataUpdatedAt),
      });
      if (decision === "send") sendHeartbeat(heartbeatId);
      else if (decision === "refetch") {
        void queryClient.invalidateQueries({ queryKey: currentSessionKeys.all });
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [heartbeatId, queryClient, sendHeartbeat]);

  return null;
}
