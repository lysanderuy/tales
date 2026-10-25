"use client";

import { useState } from "react";

import { SettingsDeleteDialog } from "@/components/shared/settings-delete-dialog";
import { SettingsPasswordDialog } from "@/components/shared/settings-password-dialog";
import {
  SettingsRow,
  SettingsSection,
  dangerPillClass,
  pillClass,
} from "@/components/shared/settings-parts";
import { messages } from "@/lib/messages";

export function SettingsAccount() {
  const [changing, setChanging] = useState<{ opener: HTMLElement | null } | null>(null);
  const [deleting, setDeleting] = useState<{ opener: HTMLElement | null } | null>(null);

  return (
    <SettingsSection id="account" title={messages.settingsAccount}>
      <SettingsRow title={messages.settingsPassword}>
        <button
          type="button"
          className={pillClass}
          onClick={(event) => setChanging({ opener: event.currentTarget })}
        >
          {messages.settingsChangePassword}
        </button>
      </SettingsRow>
      <SettingsRow title={messages.profileSignOut}>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className={pillClass}>
            {messages.profileSignOut}
          </button>
        </form>
      </SettingsRow>
      <SettingsRow title={messages.settingsDeleteAccount}>
        <button
          type="button"
          className={dangerPillClass}
          onClick={(event) => setDeleting({ opener: event.currentTarget })}
        >
          {messages.settingsDeleteAccount}
        </button>
      </SettingsRow>
      {changing ? (
        <SettingsPasswordDialog opener={changing.opener} onClose={() => setChanging(null)} />
      ) : null}
      {deleting ? (
        <SettingsDeleteDialog opener={deleting.opener} onClose={() => setDeleting(null)} />
      ) : null}
    </SettingsSection>
  );
}
