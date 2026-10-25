"use client";

import { useState, type FormEvent } from "react";

import { DialogShell } from "@/components/shared/dialog-shell";
import { PasswordField } from "@/components/shared/password-field";
import { accountFailureText, pillClass } from "@/components/shared/settings-parts";
import { Button } from "@/components/ui/button";
import { useChangePassword } from "@/hooks/use-change-password";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";

const MIN_LENGTH = 8;

type SettingsPasswordDialogProps = { opener: HTMLElement | null; onClose: () => void };

export function SettingsPasswordDialog({ opener, onClose }: SettingsPasswordDialogProps) {
  const change = useChangePassword({ toastOnError: false });
  const show = useToastStore((state) => state.show);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);

  function invalid(): string | null {
    if (!current || !next) return messages.settingsPasswordMissing;
    if (next.length < MIN_LENGTH) return messages.settingsPasswordShort;
    return null;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = invalid();
    setError(problem);
    if (problem) return;
    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      show(messages.settingsSaved);
      onClose();
    } catch (failure) {
      setError(accountFailureText(failure));
    }
  }

  return (
    <DialogShell label={messages.settingsChangePassword} opener={opener} onClose={onClose}>
      {() => (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-6">
          <h2 className="mb-5 text-h2 font-semibold tracking-[-0.01em]">
            {messages.settingsChangePassword}
          </h2>
          <div className="grid gap-4">
            <PasswordField
              label={messages.settingsPasswordCurrent}
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
            <PasswordField
              label={messages.settingsPasswordNew}
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-ui text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={pillClass} onClick={onClose}>
              {messages.settingsCancel}
            </button>
            <Button type="submit" disabled={change.isPending} aria-busy={change.isPending}>
              {messages.settingsUpdatePassword}
            </Button>
          </div>
        </form>
      )}
    </DialogShell>
  );
}
