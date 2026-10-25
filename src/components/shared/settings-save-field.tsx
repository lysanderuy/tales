"use client";

import { useState, type KeyboardEvent } from "react";

import { LockIcon } from "@/components/shared/settings-icons";
import { TextField } from "@/components/ui/text-field";
import { messages } from "@/lib/messages";
import { decideCommit } from "@/lib/settings/commit";

type SaveFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onSave: (value: string) => Promise<boolean>;
};

export function SaveField({ label, value, placeholder, required = false, onSave }: SaveFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function commit() {
    if (draft === null || saving) return;
    const decision = decideCommit({ draft, value, required });
    if (decision.kind === "revert-required") {
      setDraft(null);
      setError(messages.settingsNameRequired);
      return;
    }
    if (decision.kind === "skip") {
      setDraft(null);
      return;
    }
    setSaving(true);
    const saved = await onSave(decision.value);
    setSaving(false);
    // Keeps anything typed while the save was in flight.
    if (saved) setDraft((current) => (current?.trim() === decision.value ? null : current));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraft(null);
      setError(undefined);
    }
  }

  return (
    <TextField
      label={label}
      value={draft ?? value}
      placeholder={placeholder}
      error={error}
      autoComplete="off"
      onChange={(event) => {
        setDraft(event.target.value);
        setError(undefined);
      }}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
    />
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <TextField
      label={label}
      value={value}
      readOnly
      className="text-text-soft"
      trailing={
        <span className="px-2 text-text-faint">
          <LockIcon />
        </span>
      }
    />
  );
}
