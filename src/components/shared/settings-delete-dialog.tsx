"use client";

import { useState, type FormEvent } from "react";

import { DialogShell } from "@/components/shared/dialog-shell";
import { PasswordField } from "@/components/shared/password-field";
import { accountFailureText, dangerPillClass, pillClass } from "@/components/shared/settings-parts";
import { useDeleteAccount } from "@/hooks/use-delete-account";
import { messages } from "@/lib/messages";

type SettingsDeleteDialogProps = { opener: HTMLElement | null; onClose: () => void };

export function SettingsDeleteDialog({ opener, onClose }: SettingsDeleteDialogProps) {
  const remove = useDeleteAccount({ toastOnError: false });
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) return;
    setError(null);
    try {
      await remove.mutateAsync(password);
      window.location.assign("/login");
    } catch (failure) {
      setError(accountFailureText(failure));
    }
  }

  return (
    <DialogShell label={messages.settingsDeleteAccount} opener={opener} onClose={onClose}>
      {() => (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-6">
          <h2 className="text-h2 font-semibold tracking-[-0.01em]">
            {messages.settingsDeleteAccount}
          </h2>
          <p className="mb-5 mt-2 text-ui text-text-soft">{messages.settingsDeleteBody}</p>
          <PasswordField
            label={messages.settingsPassword}
            autoComplete="current-password"
            value={password}
            error={error ?? undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={pillClass} onClick={onClose}>
              {messages.settingsKeepIt}
            </button>
            <button
              type="submit"
              className={dangerPillClass}
              disabled={!password || remove.isPending}
            >
              {messages.settingsDeleteConfirm}
            </button>
          </div>
        </form>
      )}
    </DialogShell>
  );
}
