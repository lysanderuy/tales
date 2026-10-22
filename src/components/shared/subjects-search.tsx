"use client";

import { useRef } from "react";

import { CloseIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";

type SubjectsSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SubjectsSearch({ value, onChange }: SubjectsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative mb-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={messages.subjectsSearchPlaceholder}
        aria-label={messages.subjectsSearchPlaceholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.stopPropagation();
            onChange("");
          }
        }}
        className="min-h-11 w-full rounded-full bg-fill py-[11px] pl-4 pr-11 text-ui text-text outline-none placeholder:text-text-faint focus-visible:shadow-[inset_0_0_0_1.5px_var(--border)] focus-visible:outline-none"
      />
      {value.trim() ? (
        <IconButton
          size="xs"
          label={messages.subjectsClear}
          className="absolute right-[5px] top-[5px]"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <CloseIcon size={16} />
        </IconButton>
      ) : null}
    </div>
  );
}
