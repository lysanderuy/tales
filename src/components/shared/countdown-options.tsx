"use client";

import { messages } from "@/lib/messages";

const COUNTDOWN_MINUTES = [25, 45, 60] as const;

const inputClass =
  "w-full rounded-row bg-transparent p-2.5 text-left text-ui text-text placeholder:text-text hover:bg-fill focus:bg-fill focus:placeholder:text-text-faint";

type CountdownOptionsProps = {
  disabled?: boolean;
  onSelect: (minutes: number) => void;
};

export function CountdownOptions({ disabled, onSelect }: CountdownOptionsProps) {
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
        type="text"
        inputMode="numeric"
        maxLength={3}
        placeholder={messages.todayCustomMinutes}
        aria-label={messages.todayCustomMinutesLabel}
        disabled={disabled}
        onInput={(event) => {
          event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const minutes = Number(event.currentTarget.value);
          if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 600) onSelect(minutes);
        }}
        className={inputClass}
      />
    </>
  );
}
