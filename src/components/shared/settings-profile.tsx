"use client";

import { SettingsPicture } from "@/components/shared/settings-picture";
import { SettingsSection } from "@/components/shared/settings-parts";
import { ReadOnlyField, SaveField } from "@/components/shared/settings-save-field";
import { useSaveProfile } from "@/hooks/use-save-profile";
import type { ProfileResponse } from "@/validators/profile.validator";
import { messages } from "@/lib/messages";

export function SettingsProfile({ profile }: { profile: ProfileResponse }) {
  const save = useSaveProfile();

  return (
    <SettingsSection id="profile" title={messages.settingsProfile}>
      <SettingsPicture url={profile.avatarUrl} name={profile.displayName} />
      <div className="grid gap-4 min-[900px]:grid-cols-2">
        <SaveField
          label={messages.settingsName}
          value={profile.displayName}
          required
          onSave={(value) => save({ displayName: value })}
        />
        <ReadOnlyField label={messages.settingsEmail} value={profile.email} />
        <SaveField
          label={messages.settingsReviewCenter}
          value={profile.reviewCenter ?? ""}
          placeholder={messages.settingsOptional}
          onSave={(value) => save({ reviewCenter: value || null })}
        />
        <SaveField
          label={messages.settingsSchool}
          value={profile.school ?? ""}
          placeholder={messages.settingsOptional}
          onSave={(value) => save({ school: value || null })}
        />
      </div>
    </SettingsSection>
  );
}
