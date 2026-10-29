"use client";

import { useState, type ReactNode, type Ref } from "react";

import { TextField } from "@/components/ui/text-field";
import { messages } from "@/lib/messages";
import { formatTimeOfDay, parseTimeOfDay } from "@/lib/plan/time";

type TimeFieldProps = {
  label: string;
  defaultValue?: string;
  onChange: (value: string, valid: boolean) => void;
  trailing?: ReactNode;
  disabled?: boolean;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export function TimeField({
  label,
  defaultValue = "",
  onChange,
  trailing,
  disabled,
  error,
  inputRef,
}: TimeFieldProps) {
  const [text, setText] = useState(defaultValue ? formatTimeOfDay(defaultValue) : "");
  const [touched, setTouched] = useState(false);
  const parsed = parseTimeOfDay(text);

  const commit = () => {
    setTouched(true);
    if (parsed.ok) setText(parsed.value ? formatTimeOfDay(parsed.value) : "");
  };

  return (
    <TextField
      label={label}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={messages.timePlaceholder}
      value={text}
      error={touched && !parsed.ok ? messages.timeInvalid : error}
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
      disabled={disabled}
      ref={inputRef}
      className="num"
    />
  );
}
