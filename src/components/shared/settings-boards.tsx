"use client";

import { DateField } from "@/components/shared/date-field";
import { SettingsSection } from "@/components/shared/settings-parts";
import { useSaveProfile } from "@/hooks/use-save-profile";
import { useToday } from "@/hooks/use-today";
import type { Profile } from "@/db/schema";
import { messages } from "@/lib/messages";
import { localDateKey } from "@/lib/time/zone";

export function SettingsBoards({ profile }: { profile: Profile }) {
  const save = useSaveProfile();
  const todayQuery = useToday();
  const today = todayQuery.data?.todayDate ?? localDateKey(new Date(), profile.timeZone);

  return (
    <SettingsSection id="boards" title={messages.settingsBoards}>
      <div className="max-w-[280px]">
        <DateField
          label={messages.settingsDateOfBoards}
          placeholder={messages.settingsPickDate}
          value={profile.examDate ?? ""}
          today={today}
          onChange={(value) => void save({ examDate: value })}
          onClear={() => void save({ examDate: null })}
        />
      </div>
    </SettingsSection>
  );
}
