"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, CloseIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";
import { nameErrorMessage, validateName } from "@/lib/subjects/name";
import { NODE_NAME_MAX_LENGTH } from "@/validators/outline-node.validator";

type SubjectsAddRowProps = {
  depth: number;
  isSubject: boolean;
  names: readonly string[];
  pending: boolean;
  onSubmit: (name: string, onDone: () => void) => void;
  onCancel: () => void;
};

export function SubjectsAddRow({
  depth,
  isSubject,
  names,
  pending,
  onSubmit,
  onCancel,
}: SubjectsAddRowProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    inputRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  function submit() {
    const name = value.trim();
    const problem = validateName(name, names);
    if (problem) {
      setError(nameErrorMessage(problem));
      return;
    }
    onSubmit(name, () => {
      setValue("");
      setError(null);
      inputRef.current?.focus({ preventScroll: true });
    });
  }

  const label = isSubject ? messages.subjectsSubjectName : messages.subjectsTopicName;

  return (
    <div className="py-1.5 pr-2" style={{ paddingLeft: `calc(8px + ${depth} * 16px + 32px)` }}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={NODE_NAME_MAX_LENGTH}
          placeholder={label}
          aria-label={messages.subjectsNameLabel}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
            else if (event.key === "Escape") {
              event.stopPropagation();
              onCancel();
            }
          }}
          className="min-h-11 min-w-0 flex-1 rounded-field bg-fill px-3.5 py-2.5 text-ui text-text outline-none placeholder:text-text-faint focus-visible:shadow-[inset_0_0_0_1.5px_var(--primary)] focus-visible:outline-none"
        />
        <IconButton size="xs" label={messages.subjectsCancel} onClick={onCancel}>
          <CloseIcon size={16} />
        </IconButton>
        <IconButton
          size="xs"
          variant="solid"
          label={messages.subjectsAdd}
          disabled={pending}
          onClick={submit}
        >
          <CheckIcon />
        </IconButton>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 pl-0.5 text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
