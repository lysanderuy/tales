"use client";

import { useState } from "react";

import { SettingsSetDetail } from "@/components/shared/settings-set-detail";
import { SettingsSetsList } from "@/components/shared/settings-sets-list";
import { SettingsSection } from "@/components/shared/settings-parts";
import { Button } from "@/components/ui/button";
import { useCreateDailySet } from "@/hooks/use-create-daily-set";
import { useDailySets } from "@/hooks/use-daily-sets";
import { useSelectDailySet } from "@/hooks/use-select-daily-set";
import { messages } from "@/lib/messages";

export function SettingsSets() {
  const sets = useDailySets();
  const create = useCreateDailySet();
  const select = useSelectDailySet();
  const [viewId, setViewId] = useState<string | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);

  const list = sets.data;
  const viewed = list
    ? (list.find((set) => set.id === viewId) ?? list.find((set) => set.active) ?? list[0])
    : null;

  function addSet() {
    create.mutate(messages.settingsNewSet, {
      onSuccess: (created) => {
        setViewId(created.id);
        setFreshId(created.id);
      },
    });
  }

  return (
    <SettingsSection id="sets" title={messages.settingsDailySets}>
      {sets.isError && !list ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button variant="fill" onClick={() => void sets.refetch()}>
            {messages.tryAgain}
          </Button>
        </div>
      ) : !list ? (
        <div aria-busy="true" className="min-h-[320px] rounded-row bg-fill" />
      ) : (
        <div className="grid min-h-[320px] gap-6 min-[900px]:grid-cols-[240px_minmax(0,1fr)]">
          <SettingsSetsList
            sets={list}
            viewedId={viewed?.id ?? null}
            adding={create.isPending}
            onView={setViewId}
            onSelect={(id) => select.mutate(id)}
            onAdd={addSet}
          />
          {viewed ? (
            <SettingsSetDetail
              key={viewed.id}
              set={viewed}
              focusTitle={viewed.id === freshId}
              onDeleted={() => setViewId(null)}
            />
          ) : null}
        </div>
      )}
    </SettingsSection>
  );
}
