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
import { useProfile } from "@/hooks/use-profile";
import { useRenameDailySet } from "@/hooks/use-rename-daily-set";
import { cn } from "@/lib/cn";
import { formatShortDate } from "@/lib/events/dates";
import { messages } from "@/lib/messages";
import { DEFAULT_TIME_ZONE, localDateKey } from "@/lib/time/zone";
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

function LineRow({
  line,
  builtIn,
  today,
}: {
  line: DailyLineResponse;
  builtIn: boolean;
  today: string;
}) {
  const hide = useHideDailyLine();
  const remove = useDeleteDailyLine();
  const hidden = builtIn && line.hidden;
  const label = builtIn
    ? line.hidden
      ? messages.settingsShowLine
      : messages.settingsHideLine
    : messages.settingsRemoveLine;

  return (
    <li
      data-today={line.readingDate === today ? "" : undefined}
      className="group flex items-center gap-2 border-t border-border py-3.5 first:border-t-0"
    >
      <div className={cn("min-w-0 flex-1", hidden && "text-text-faint")}>
        {line.readingDate ? (
          <p className="num mb-1 text-small text-text-faint">
            {line.readingDate === today
              ? messages.settingsLineToday
              : formatShortDate(line.readingDate, today)}
          </p>
        ) : null}
        <span>{line.text}</span>
      </div>
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
  const profile = useProfile();
  const today = localDateKey(new Date(), profile.data?.timeZone ?? DEFAULT_TIME_ZONE);
  const listRef = useRef<HTMLUListElement>(null);
  const scrolledFor = useRef<string | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !lines.data || scrolledFor.current === set.id) return;
    scrolledFor.current = set.id;
    const row = list.querySelector<HTMLElement>("[data-today]");
    if (row) list.scrollTop = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
  }, [lines.data, set.id]);

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
        <ul ref={listRef} className="overflow-y-auto pr-2" style={{ maxHeight: 360 }}>
          {lines.data?.map((line) => (
            <LineRow key={line.id} line={line} builtIn={set.builtIn} today={today} />
          ))}
        </ul>
      )}
      {set.builtIn ? null : <SettingsSetAddLine setId={set.id} />}
    </div>
  );
}
