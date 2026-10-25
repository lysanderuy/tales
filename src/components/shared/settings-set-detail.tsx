"use client";

import { useEffect, useRef, useState } from "react";

import { CloseIcon } from "@/components/shared/icons";
import { EyeIcon, EyeOffIcon, TrashIcon } from "@/components/shared/settings-icons";
import { SettingsSetAddLine } from "@/components/shared/settings-set-add-line";
import { dangerPillClass, pillClass } from "@/components/shared/settings-parts";
import { IconButton } from "@/components/ui/icon-button";
import { useDailySetLines } from "@/hooks/use-daily-set-lines";
import { useDeleteDailyLine } from "@/hooks/use-delete-daily-line";
import { useDeleteDailySet } from "@/hooks/use-delete-daily-set";
import { useHideDailyLine } from "@/hooks/use-hide-daily-line";
import { useRenameDailySet } from "@/hooks/use-rename-daily-set";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import { useToastStore } from "@/stores/toast.store";
import type { DailyLineResponse, DailySetResponse } from "@/validators/daily-set.validator";

type SettingsSetDetailProps = {
  set: DailySetResponse;
  focusTitle: boolean;
  onDeleted: () => void;
};

const lineActionClass =
  "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100";

function SetTitle({ set, focus }: { set: DailySetResponse; focus: boolean }) {
  const rename = useRenameDailySet();
  const show = useToastStore((state) => state.show);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(set.name);

  useEffect(() => {
    if (!focus) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focus]);

  function commit() {
    const trimmed = title.trim();
    if (!trimmed) return setTitle(set.name);
    setTitle(trimmed);
    if (trimmed === set.name) return;
    rename.mutate(
      { id: set.id, name: trimmed },
      { onSuccess: () => show(messages.settingsSaved), onError: () => setTitle(set.name) },
    );
  }

  return (
    <input
      ref={inputRef}
      value={title}
      maxLength={60}
      aria-label={messages.settingsSetName}
      onChange={(event) => setTitle(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="-ml-2 min-w-0 flex-1 rounded-row bg-transparent px-2 py-1 text-lg font-semibold tracking-[-0.01em] outline-none hover:bg-fill focus:bg-fill"
    />
  );
}

function SetDelete({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const remove = useDeleteDailySet();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <IconButton
        size="xs"
        variant="fill"
        className="bg-transparent text-text-soft hover:bg-fill-hover"
        label={messages.settingsDeleteSet}
        onClick={() => setConfirming(true)}
      >
        <TrashIcon />
      </IconButton>
    );
  }
  return (
    <>
      <button
        type="button"
        className={dangerPillClass}
        disabled={remove.isPending}
        onClick={() => remove.mutate(id, { onSuccess: onDeleted })}
      >
        {messages.settingsDeleteSetYes}
      </button>
      <button type="button" className={pillClass} onClick={() => setConfirming(false)}>
        {messages.settingsKeepIt}
      </button>
    </>
  );
}

function LineRow({ line, builtIn }: { line: DailyLineResponse; builtIn: boolean }) {
  const hide = useHideDailyLine();
  const remove = useDeleteDailyLine();
  const hidden = builtIn && line.hidden;
  const label = builtIn
    ? line.hidden
      ? messages.settingsShowLine
      : messages.settingsHideLine
    : messages.settingsRemoveLine;

  return (
    <li className="group flex items-center gap-2 border-t border-border py-3.5 first:border-t-0">
      <span className={cn("flex-1", hidden && "text-text-faint")}>{line.text}</span>
      <IconButton
        size="xs"
        variant="fill"
        label={label}
        className={cn(
          "bg-transparent text-text-soft hover:bg-fill-hover",
          !hidden && lineActionClass,
        )}
        onClick={() =>
          builtIn ? hide.mutate({ id: line.id, hide: !line.hidden }) : remove.mutate(line.id)
        }
      >
        {builtIn ? line.hidden ? <EyeIcon /> : <EyeOffIcon /> : <CloseIcon />}
      </IconButton>
    </li>
  );
}

export function SettingsSetDetail({ set, focusTitle, onDeleted }: SettingsSetDetailProps) {
  const lines = useDailySetLines(set.id);

  return (
    <div className="flex min-w-0 flex-col min-[900px]:border-l min-[900px]:border-border min-[900px]:pl-6">
      <div className="mb-2 flex min-h-[34px] items-center gap-2">
        {set.builtIn ? (
          <h3 className="flex-1 text-lg font-semibold tracking-[-0.01em]">{set.name}</h3>
        ) : (
          <>
            <SetTitle set={set} focus={focusTitle} />
            <SetDelete id={set.id} onDeleted={onDeleted} />
          </>
        )}
      </div>
      {lines.isError && !lines.data ? (
        <p className="text-small text-text-soft">{messages.serverError}</p>
      ) : lines.data && lines.data.length === 0 ? (
        <p className="text-small text-text-soft">{messages.settingsNoLines}</p>
      ) : (
        <ul>
          {lines.data?.map((line) => (
            <LineRow key={line.id} line={line} builtIn={set.builtIn} />
          ))}
        </ul>
      )}
      {set.builtIn ? null : <SettingsSetAddLine setId={set.id} />}
    </div>
  );
}
