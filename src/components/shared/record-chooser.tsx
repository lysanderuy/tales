"use client";

import { useRef, type RefObject } from "react";

import { useDismiss } from "@/components/shared/use-dismiss";

export type RecordChoice = { recordId: string; label: string };

type RecordChooserProps = {
  choices: readonly RecordChoice[];
  triggerRef: RefObject<HTMLElement | null>;
  onChoose: (recordId: string) => void;
  onClose: () => void;
};

export function RecordChooser({ choices, triggerRef, onChoose, onClose }: RecordChooserProps) {
  const containerRef = useRef<HTMLUListElement>(null);
  useDismiss(containerRef, triggerRef, true, onClose);

  return (
    <ul
      ref={containerRef}
      className="absolute left-0 top-full z-[6] mt-1 w-[220px] rounded-field border border-border bg-surface p-1.5"
    >
      {choices.map((choice) => (
        <li key={choice.recordId}>
          <button
            type="button"
            onClick={() => onChoose(choice.recordId)}
            className="num flex w-full items-center rounded-row p-2.5 text-left text-ui hover:bg-fill"
          >
            {choice.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
