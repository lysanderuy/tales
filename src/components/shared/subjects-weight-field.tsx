"use client";

import { useState } from "react";

import { messages } from "@/lib/messages";
import { parseWeight } from "@/lib/subjects/name";

type SubjectsWeightFieldProps = {
  value: number | null;
  onCommit: (value: number | null) => void;
};

export function SubjectsWeightField({ value, onCommit }: SubjectsWeightFieldProps) {
  const [text, setText] = useState(value === null ? "" : String(value));
  const [invalid, setInvalid] = useState(false);

  function commit() {
    const result = parseWeight(text);
    if (!result.ok) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setText(result.value === null ? "" : String(result.value));
    onCommit(result.value);
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 py-[7px] text-ui">
        <label htmlFor="subject-weight">{messages.subjectsTopicWeight}</label>
        <span className="relative ml-auto">
          <input
            id="subject-weight"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={text}
            placeholder="–"
            onChange={(event) => {
              setText(event.target.value);
              setInvalid(false);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="num min-h-9 w-[76px] rounded-row bg-fill py-1.5 pl-2.5 pr-7 text-right text-ui text-text outline-none [appearance:textfield] placeholder:text-text-faint hover:bg-fill-hover focus-visible:shadow-[inset_0_0_0_1.5px_var(--primary)] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-small text-text-faint">
            %
          </span>
        </span>
      </div>
      {invalid ? (
        <p role="alert" className="text-small text-danger">
          {messages.subjectsWeightRange}
        </p>
      ) : null}
    </div>
  );
}
