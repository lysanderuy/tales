"use client";

import { CheckIcon, PlusIcon } from "@/components/shared/icons";
import { Eyebrow } from "@/components/ui/eyebrow";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import type { DailySetResponse } from "@/validators/daily-set.validator";

type SettingsSetsListProps = {
  sets: DailySetResponse[];
  viewedId: string | null;
  adding: boolean;
  onView: (id: string) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

type RowProps = {
  set: DailySetResponse;
  viewed: boolean;
  onView: (id: string) => void;
  onSelect: (id: string) => void;
};

function SetRow({ set, viewed, onView, onSelect }: RowProps) {
  const name = set.name || messages.settingsUntitled;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-row py-1 pl-3 pr-2 transition-colors hover:bg-fill",
        viewed && "bg-fill",
      )}
    >
      <button
        type="button"
        aria-current={viewed ? "true" : undefined}
        onClick={() => onView(set.id)}
        className="min-w-0 flex-1 truncate py-2 text-left text-ui font-medium"
      >
        {name}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={set.active}
        aria-label={messages.settingsShowOnToday(name)}
        title={set.active ? undefined : messages.settingsShowOnToday(name)}
        onClick={() => {
          if (!set.active) onSelect(set.id);
        }}
        className={cn(
          "mr-1 grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
          set.active
            ? "cursor-default border-primary bg-primary text-on-primary"
            : "border-text-faint text-transparent hover:border-primary",
        )}
      >
        <CheckIcon size={13} />
      </button>
    </div>
  );
}

export function SettingsSetsList({
  sets,
  viewedId,
  adding,
  onView,
  onSelect,
  onAdd,
}: SettingsSetsListProps) {
  const builtIn = sets.filter((set) => set.builtIn);
  const own = sets.filter((set) => !set.builtIn);
  const row = (set: DailySetResponse) => (
    <SetRow
      key={set.id}
      set={set}
      viewed={set.id === viewedId}
      onView={onView}
      onSelect={onSelect}
    />
  );

  return (
    <div role="radiogroup" aria-label={messages.settingsSetsGroup} className="flex flex-col gap-1">
      <div className="flex min-h-[34px] items-center pl-3">
        <Eyebrow>{messages.settingsBuiltIn}</Eyebrow>
      </div>
      {builtIn.map(row)}
      <div className="mt-3 flex min-h-[34px] items-center justify-between pl-3">
        <Eyebrow>{messages.settingsYours}</Eyebrow>
        <IconButton size="xs" label={messages.settingsNewSet} disabled={adding} onClick={onAdd}>
          <PlusIcon size={18} />
        </IconButton>
      </div>
      {own.map(row)}
    </div>
  );
}
