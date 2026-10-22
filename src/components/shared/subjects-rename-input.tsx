"use client";

import { useEffect, useRef } from "react";

import { messages } from "@/lib/messages";
import { nameErrorMessage, validateName } from "@/lib/subjects/name";
import { useToastStore } from "@/stores/toast.store";
import { NODE_NAME_MAX_LENGTH } from "@/validators/outline-node.validator";

type SubjectsRenameInputProps = {
  initial: string;
  names: readonly string[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export function SubjectsRenameInput({
  initial,
  names,
  onSubmit,
  onCancel,
}: SubjectsRenameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function submit(value: string) {
    const name = value.trim();
    if (name === initial) {
      onSubmit(name);
      return;
    }
    const error = validateName(name, names);
    if (error) showToast(nameErrorMessage(error));
    else onSubmit(name);
  }

  return (
    <input
      ref={inputRef}
      defaultValue={initial}
      maxLength={NODE_NAME_MAX_LENGTH}
      aria-label={messages.subjectsRenameLabel}
      onClick={(event) => event.stopPropagation()}
      onBlur={onCancel}
      onKeyDown={(event) => {
        if (event.key === "Enter") submit(event.currentTarget.value);
        else if (event.key === "Escape") {
          event.stopPropagation();
          onCancel();
        }
      }}
      className="min-h-9 min-w-0 flex-1 rounded-field bg-fill px-3 py-1.5 text-ui font-semibold text-text outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--primary)] focus-visible:outline-none"
    />
  );
}
