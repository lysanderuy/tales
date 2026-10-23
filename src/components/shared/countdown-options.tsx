"use client";

import { useState, type Ref } from "react";

import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { MAX_PLANNED_MINUTES, MIN_PLANNED_MINUTES } from "@/validators/study-session.validator";

const COUNTDOWN_MINUTES = [25, 45, 60] as const;

const inputClass =
  "w-full rounded-row bg-transparent p-2.5 text-left text-ui text-text outline-none placeholder:text-text hover:bg-fill focus:bg-fill focus:placeholder:text-text-faint";

export function parseCustomMinutes(text: string): number | null {
  const minutes = Number(text);
  return text !== "" &&
    Number.isInteger(minutes) &&
    minutes >= MIN_PLANNED_MINUTES &&
    minutes <= MAX_PLANNED_MINUTES
    ? minutes
    : null;
}

type CountdownOptionsProps = {
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onSelect: (minutes: number) => void;
};

export function CountdownOptions({ disabled, inputRef, onSelect }: CountdownOptionsProps) {
  const [invalid, setInvalid] = useState(false);

  return (
    <>
      {COUNTDOWN_MINUTES.map((minutes) => (
        <button
          key={minutes}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(minutes)}
          className="flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill"
        >
          {minutes} min
        </button>
      ))}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={3}
        placeholder={messages.todayCustomMinutes}
        aria-label={messages.todayCustomMinutesLabel}
        aria-invalid={invalid}
        disabled={disabled}
        onInput={(event) => {
          const text = event.currentTarget.value.replace(/\D/g, "");
          event.currentTarget.value = text;
          setInvalid(text !== "" && parseCustomMinutes(text) === null);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const minutes = parseCustomMinutes(event.currentTarget.value);
          if (minutes !== null) onSelect(minutes);
        }}
        className={cn(inputClass, invalid && "text-danger ring-1 ring-danger")}
      />
    </>
  );
}
