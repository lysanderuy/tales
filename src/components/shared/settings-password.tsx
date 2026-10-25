"use client";

import { useState, type FormEvent } from "react";

import { PasswordField } from "@/components/shared/password-field";
import { accountFailureText } from "@/components/shared/settings-parts";
import { IconButton } from "@/components/ui/icon-button";
import { CheckIcon, CloseIcon } from "@/components/shared/icons";
import { useChangePassword } from "@/hooks/use-change-password";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";

const MIN_LENGTH = 8;

export function SettingsPassword({ onClose }: { onClose: () => void }) {
  const change = useChangePassword({ toastOnError: false });
  const show = useToastStore((state) => state.show);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function invalid(): string | null {
    if (!current || !next) return messages.settingsPasswordMissing;
    if (next.length < MIN_LENGTH) return messages.settingsPasswordShort;
    if (next !== confirm) return messages.settingsPasswordMismatch;
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
    <form onSubmit={(event) => void onSubmit(event)} className="pb-4">
      <div className="grid gap-4 min-[900px]:grid-cols-3">
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
        <PasswordField
          label={messages.settingsPasswordConfirm}
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <p role="alert" className="flex-1 text-small text-danger">
          {error}
        </p>
        <IconButton size="xs" label={messages.settingsCancel} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <IconButton
          size="xs"
          variant="solid"
          type="submit"
          label={messages.settingsUpdatePassword}
          disabled={change.isPending}
        >
          <CheckIcon size={18} />
        </IconButton>
      </div>
    </form>
  );
}
