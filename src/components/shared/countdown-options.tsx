"use client";

import { useId } from "react";

import { messages } from "@/lib/messages";

const COUNTDOWN_MINUTES = [25, 45, 60] as const;

const inputClass =
  "w-16 rounded-full bg-fill px-2.5 py-2 text-center text-ui text-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

type CountdownOptionsProps = {
  disabled?: boolean;
  onSelect: (minutes: number) => void;
};

export function CountdownOptions({ disabled, onSelect }: CountdownOptionsProps) {
  const inputId = useId();

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
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <label htmlFor={inputId} className="flex-1 text-ui text-text-soft">
          {messages.todayCustomMinutes}
        </label>
        <input
          id={inputId}
          type="number"
          min={1}
          max={600}
          placeholder={messages.todayCustomMinutesPlaceholder}
          aria-label={messages.todayCustomMinutesLabel}
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            const minutes = Number(event.currentTarget.value);
            if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 600) onSelect(minutes);
          }}
          className={inputClass}
        />
      </div>
    </>
  );
}
