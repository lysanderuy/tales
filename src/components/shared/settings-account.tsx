"use client";

import { useState } from "react";

import { SettingsDeleteDialog } from "@/components/shared/settings-delete-dialog";
import { SettingsPassword } from "@/components/shared/settings-password";
import {
  SettingsRow,
  SettingsSection,
  dangerPillClass,
  pillClass,
} from "@/components/shared/settings-parts";
import { messages } from "@/lib/messages";

export function SettingsAccount() {
  const [changing, setChanging] = useState(false);
  const [deleting, setDeleting] = useState<{ opener: HTMLElement | null } | null>(null);

  return (
    <SettingsSection id="account" title={messages.settingsAccount}>
      <SettingsRow title={messages.settingsPassword}>
        <button
          type="button"
          className={pillClass}
          aria-expanded={changing}
          onClick={() => setChanging((value) => !value)}
        >
          {messages.settingsChangePassword}
        </button>
      </SettingsRow>
      {changing ? <SettingsPassword onClose={() => setChanging(false)} /> : null}
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
      {deleting ? (
        <SettingsDeleteDialog opener={deleting.opener} onClose={() => setDeleting(null)} />
      ) : null}
    </SettingsSection>
  );
}
