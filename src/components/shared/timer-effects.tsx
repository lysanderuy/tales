"use client";

import { useEffect, useMemo } from "react";

import { useCountdownChime } from "@/hooks/use-countdown-chime";
import { useHeartbeatSession } from "@/hooks/use-heartbeat-session";
import { useSessionClock } from "@/hooks/use-session-clock";
import { useSubjects } from "@/hooks/use-subjects";
import { messages } from "@/lib/messages";
import { tabTitle } from "@/lib/timer/clock";
import { buildSubjectIndex } from "@/lib/today/subject-index";

const HEARTBEAT_MS = 60_000;

export function TimerEffects() {
  const { session, display } = useSessionClock();
  const subjects = useSubjects();
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
    sendHeartbeat(heartbeatId);
    const timer = setInterval(() => sendHeartbeat(heartbeatId), HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [heartbeatId, sendHeartbeat]);

  return null;
}
