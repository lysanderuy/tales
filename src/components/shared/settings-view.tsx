"use client";

import { SettingsAccount } from "@/components/shared/settings-account";
import { SettingsAppearance } from "@/components/shared/settings-appearance";
import { SettingsBoards } from "@/components/shared/settings-boards";
import { SettingsProfile } from "@/components/shared/settings-profile";
import { SettingsRail } from "@/components/shared/settings-rail";
import { SettingsSets } from "@/components/shared/settings-sets";
import { SettingsSkeleton } from "@/components/shared/settings-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { messages } from "@/lib/messages";

const mainClass = "mx-auto w-full max-w-[1200px] flex-1 px-6 pb-[72px] pt-8";

export function SettingsView() {
  const profile = useProfile();

  if (profile.isError && !profile.data) {
    return (
      <main className={mainClass}>
        <Card className="flex flex-col items-start gap-4">
          <p className="text-body">{messages.serverError}</p>
          <Button variant="fill" onClick={() => void profile.refetch()}>
            {messages.tryAgain}
          </Button>
        </Card>
      </main>
    );
  }

  if (!profile.data) return <SettingsSkeleton />;

  return (
    <main
      className={`${mainClass} grid items-start justify-center gap-10 min-[900px]:grid-cols-[176px_minmax(0,760px)]`}
    >
      <SettingsRail />
      <div className="flex min-w-0 flex-col gap-4 min-[900px]:col-start-2">
        <h1 className="mb-2 text-h1 font-semibold tracking-[-0.02em]">{messages.settingsTitle}</h1>
        <SettingsProfile profile={profile.data} />
        <SettingsBoards profile={profile.data} />
        <SettingsSets />
        <SettingsAppearance theme={profile.data.theme} />
        <SettingsAccount />
      </div>
    </main>
  );
}
