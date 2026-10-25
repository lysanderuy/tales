"use client";

import type { ReactNode } from "react";

import { MoonIcon, SunIcon } from "@/components/shared/settings-icons";
import { SettingsRow, SettingsSection } from "@/components/shared/settings-parts";
import { useUpdateProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";
import type { UpdateProfileInput } from "@/validators/profile.validator";

type Theme = NonNullable<UpdateProfileInput["theme"]>;

const options: Array<{ value: Theme; label: string; icon: ReactNode }> = [
  { value: "light", label: messages.settingsLight, icon: <SunIcon /> },
  { value: "dark", label: messages.settingsDark, icon: <MoonIcon /> },
];

export function SettingsAppearance({ theme }: { theme: string }) {
  const update = useUpdateProfile({ toastOnError: true });

  return (
    <SettingsSection id="appearance" title={messages.settingsAppearance}>
      <SettingsRow title={messages.settingsTheme}>
        <div role="radiogroup" aria-label={messages.settingsTheme} className="flex gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={theme === option.value}
              onClick={() => {
                if (theme !== option.value) update.mutate({ theme: option.value });
              }}
              className={cn(
                "press inline-flex items-center gap-2 rounded-full px-4 py-2 text-ui font-medium",
                theme === option.value
                  ? "bg-primary-soft text-primary"
                  : "bg-fill hover:bg-fill-hover",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </SettingsRow>
    </SettingsSection>
  );
}
