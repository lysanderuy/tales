"use client";

import { useRef, useState, type ClipboardEvent } from "react";

import { CheckIcon, CloseIcon, PlusIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { useAddDailyLine } from "@/hooks/use-add-daily-line";
import { useBulkDailyLines } from "@/hooks/use-bulk-daily-lines";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";

type Staged = { text: string; added: number };

export function SettingsSetAddLine({ setId }: { setId: string }) {
  const add = useAddDailyLine();
  const bulk = useBulkDailyLines();
  const show = useToastStore((state) => state.show);
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<Staged | null>(null);

  function addOne() {
    const trimmed = text.trim();
    if (!trimmed) return;
    add.mutate(
      { setId, text: trimmed },
      {
        onSuccess: () => {
          setText("");
          inputRef.current?.focus();
        },
      },
    );
  }

  // Several rows pasted at once are previewed by count before anything is written.
  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!/\n/.test(pasted.trim())) return;
    event.preventDefault();
    bulk.mutate(
      { setId, text: pasted, preview: true },
      {
        onSuccess: (result) =>
          result.added > 0
            ? setStaged({ text: pasted, added: result.added })
            : show(messages.settingsNothingNew),
      },
    );
  }

  function commitStaged() {
    if (!staged) return;
    bulk.mutate({ setId, text: staged.text }, { onSuccess: () => setStaged(null) });
  }

  return (
    <div className="mt-auto pt-4">
      <div className="flex min-h-[46px] items-center gap-2 rounded-field bg-fill pr-1.5 transition-colors hover:bg-fill-hover">
        <input
          ref={inputRef}
          value={text}
          maxLength={500}
          autoComplete="off"
          aria-label={messages.settingsAddLine}
          placeholder={messages.settingsAddLinePlaceholder}
          onChange={(event) => setText(event.target.value)}
          onPaste={onPaste}
          onKeyDown={(event) => {
            if (event.key === "Enter") addOne();
          }}
          className="min-h-[46px] min-w-0 flex-1 bg-transparent px-3.5 text-body outline-none placeholder:text-text-faint"
        />
        <IconButton
          size="xs"
          variant="solid"
          label={messages.settingsAddLine}
          disabled={add.isPending}
          onClick={addOne}
        >
          <PlusIcon size={18} />
        </IconButton>
      </div>
      {staged ? (
        <div role="status" className="mt-2 flex items-center gap-2 text-small text-text-soft">
          <span className="num flex-1">{`${staged.added} ${staged.added === 1 ? messages.settingsLineOne : messages.settingsLineMany}`}</span>
          <IconButton size="xs" label={messages.settingsCancel} onClick={() => setStaged(null)}>
            <CloseIcon />
          </IconButton>
          <IconButton
            size="xs"
            variant="solid"
            label={messages.settingsAddLines}
            disabled={bulk.isPending}
            onClick={commitStaged}
          >
            <CheckIcon size={18} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}
