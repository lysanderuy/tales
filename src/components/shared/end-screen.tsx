"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EndScreenDiscard } from "@/components/shared/end-screen-discard";
import { EndScreenNextUp } from "@/components/shared/end-screen-next-up";
import { EndScreenSubject } from "@/components/shared/end-screen-subject";
import { METHODS } from "@/components/shared/focus-tools";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useEndRecord } from "@/hooks/use-current-session";
import { useDeleteSession } from "@/hooks/use-delete-session";
import { useOpenFocus } from "@/hooks/use-open-focus";
import { useStartBlock } from "@/hooks/use-start-block";
import { useSubjects } from "@/hooks/use-subjects";
import { useUpdateSession } from "@/hooks/use-update-session";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { buildEndScreenUpdate, editsFromRecord, type EndScreenEdits } from "@/lib/timer/end-screen";
import { formatSeconds, splitTotal } from "@/lib/today/format";
import { buildSubjectIndex, resolveSubject } from "@/lib/today/subject-index";
import { useToastStore } from "@/stores/toast.store";
import { useUiStore } from "@/stores/ui.store";
import type { SessionResponse } from "@/validators/study-session.validator";

const NOTE_MAX_LENGTH = 5000;

const unitClass = "ml-[.12em] mr-[.35em] text-[.3em] tracking-normal text-text-faint";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <Eyebrow as="div" className="mb-2 text-center">
        {label}
      </Eyebrow>
      {children}
    </div>
  );
}

function EndScreenDialog({ record }: { record: SessionResponse }) {
  const setJustStopped = useUiStore((state) => state.setJustStopped);
  const show = useToastStore((state) => state.show);
  const update = useUpdateSession();
  const remove = useDeleteSession();
  const startBlock = useStartBlock();
  const openFocus = useOpenFocus();
  const subjects = useSubjects();
  const [edits, setEdits] = useState<EndScreenEdits>(() => editsFromRecord(record));
  const [busy, setBusy] = useState(false);
  const subjectRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const index = useMemo(() => buildSubjectIndex(subjects.data ?? []), [subjects.data]);
  const subject = edits.nodeId
    ? subjects.isSuccess
      ? resolveSubject(index, edits.nodeId, messages.todayUnknownSubject)
      : (index.get(edits.nodeId) ?? null)
    : null;
  const hasSubject = edits.nodeId !== null;
  const { hours, minutes } = splitTotal(record.activeSeconds);

  useEffect(() => {
    const opener = document.activeElement;
    const save = actionsRef.current?.querySelector<HTMLButtonElement>(":scope > button");
    (save && !save.disabled ? save : subjectRef.current)?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const patch = (changes: Partial<EndScreenEdits>) =>
    setEdits((current) => ({ ...current, ...changes }));

  const commit = async () => {
    const saved = await update.mutateAsync({
      id: record.id,
      ...buildEndScreenUpdate(record, edits),
    });
    setJustStopped(saved);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // The failing mutation has already shown its error.
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(async () => {
      await commit();
      show(messages.endSaved(formatSeconds(record.activeSeconds), subject?.name ?? ""));
      setJustStopped(null);
    });

  const onDiscard = () =>
    run(async () => {
      await remove.mutateAsync(record.id);
      setJustStopped(null);
    });

  const onNextUp = (blockId: string) =>
    run(async () => {
      await commit();
      const started = await startBlock.mutateAsync({ blockId, startedFrom: "next_up" });
      setJustStopped(null);
      openFocus(started);
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={messages.endTitle}
      className="fixed inset-0 z-[var(--z-focus)] flex flex-col items-center overflow-auto bg-bg px-6 py-8 text-center"
    >
      <div className="m-auto w-full max-w-[var(--endscreen-w)]">
        <h1 className="text-h1 font-semibold tracking-[-0.02em]">{messages.endTitle}</h1>
        <div className="num mb-1 mt-2 text-[length:var(--fs-end)] font-normal leading-none tracking-[-0.03em] text-time">
          {hours > 0 ? (
            <>
              {hours}
              <small className={unitClass}>h</small>
            </>
          ) : null}
          {hours === 0 || minutes > 0 ? (
            <>
              {minutes}
              <small className={unitClass}>min</small>
            </>
          ) : null}
        </div>

        <Section label={messages.endSubject}>
          <EndScreenSubject
            ref={subjectRef}
            nodeId={edits.nodeId}
            blockId={edits.blockId}
            subject={subject}
            onPick={(nodeId, blockId) => patch({ nodeId, blockId })}
          />
        </Section>

        <Section label={messages.endMethod}>
          <div className="flex flex-wrap justify-center gap-2">
            {METHODS.map(({ tag, label }) => (
              <button
                key={tag}
                type="button"
                aria-pressed={edits.methodTag === tag}
                onClick={() => patch({ methodTag: edits.methodTag === tag ? null : tag })}
                className={cn(
                  "press rounded-full px-[11px] py-[7px] text-ui",
                  edits.methodTag === tag
                    ? "bg-primary-soft font-medium text-primary"
                    : "bg-fill hover:bg-fill-hover",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section label={messages.endNote}>
          <textarea
            value={edits.note}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={messages.endNotePlaceholder}
            aria-label={messages.endNote}
            onChange={(event) => patch({ note: event.target.value })}
            className="block h-20 w-full resize-none rounded-field bg-fill px-3.5 py-3 text-left text-body text-text placeholder:text-text-faint"
          />
        </Section>

        <div ref={actionsRef} className="mt-6 flex items-center justify-between">
          <EndScreenDiscard disabled={busy} onDiscard={() => void onDiscard()} />
          <Button disabled={!hasSubject || busy} onClick={() => void onSave()}>
            {messages.endSave}
          </Button>
        </div>

        <EndScreenNextUp
          excludeBlockId={edits.blockId}
          index={index}
          disabled={!hasSubject || busy}
          onStart={(blockId) => void onNextUp(blockId)}
        />
      </div>
    </div>
  );
}

export function EndScreen() {
  const record = useEndRecord();
  if (!record) return null;
  return <EndScreenDialog key={record.id} record={record} />;
}
