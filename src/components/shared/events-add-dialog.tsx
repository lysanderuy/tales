"use client";

import { useState } from "react";

import { DialogShell } from "@/components/shared/dialog-shell";
import { EventsForm, type EventFormValue } from "@/components/shared/events-form";
import { failureText } from "@/components/shared/form-parts";
import { useCreateEvent } from "@/hooks/use-create-event";
import { messages } from "@/lib/messages";
import type { SubjectIndex } from "@/lib/today/subject-index";
import { useToastStore } from "@/stores/toast.store";

type EventsAddDialogProps = {
  today: string;
  index: SubjectIndex;
  opener: HTMLElement | null;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function EventsAddDialog({
  today,
  index,
  opener,
  onClose,
  onCreated,
}: EventsAddDialogProps) {
  const create = useCreateEvent({ toastOnError: false });
  const showToast = useToastStore((state) => state.show);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(value: EventFormValue) {
    setError(null);
    try {
      const created = await create.mutateAsync({
        title: value.title,
        date: value.date,
        time: value.time,
        coverIds: value.coverIds,
      });
      showToast(messages.eventsSaved);
      onCreated(created.id);
      onClose();
    } catch (failure) {
      setError(failureText(failure));
    }
  }

  return (
    <DialogShell label={messages.eventsAddTitle} opener={opener} onClose={onClose}>
      {(onOverlayChange) => (
        <div className="mt-6">
          <EventsForm
            initial={{ title: "", date: today, time: "", covers: [null], note: "", marks: {} }}
            today={today}
            index={index}
            closed={false}
            pending={create.isPending}
            error={error}
            onSubmit={(value) => void onSubmit(value)}
            onCancel={onClose}
            onOverlayChange={onOverlayChange}
          />
        </div>
      )}
    </DialogShell>
  );
}
