"use client";

import { useState, type ReactNode } from "react";

import { TextField } from "@/components/ui/text-field";
import { messages } from "@/lib/messages";
import { parseTimeOfDay } from "@/lib/plan/time";

type TimeFieldProps = {
  label: string;
  defaultValue?: string;
  onChange: (value: string, valid: boolean) => void;
  trailing?: ReactNode;
};

export function TimeField({ label, defaultValue = "", onChange, trailing }: TimeFieldProps) {
  const [text, setText] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const parsed = parseTimeOfDay(text);

  const commit = () => {
    setTouched(true);
    if (parsed.ok) setText(parsed.value ?? "");
  };

  return (
    <TextField
      label={label}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={messages.timePlaceholder}
      value={text}
      error={touched && !parsed.ok ? messages.timeInvalid : undefined}
      onChange={(event) => {
        const next = parseTimeOfDay(event.target.value);
        setText(event.target.value);
        onChange(next.ok ? (next.value ?? "") : "", next.ok);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commit();
      }}
      trailing={trailing}
      className="num"
    />
  );
}
