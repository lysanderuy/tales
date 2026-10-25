"use client";

import { useRef, useState, type ChangeEvent } from "react";

import { Avatar } from "@/components/shared/settings-avatar";
import { CloseIcon } from "@/components/shared/icons";
import { SettingsCropDialog } from "@/components/shared/settings-crop-dialog";
import { CameraIcon } from "@/components/shared/settings-icons";
import { IconButton } from "@/components/ui/icon-button";
import { useRemoveAvatar } from "@/hooks/use-remove-avatar";
import { messages } from "@/lib/messages";
import { AVATAR_RAW_MAX_BYTES } from "@/lib/settings/crop-export";
import { useToastStore } from "@/stores/toast.store";
import { isAvatarMimeType } from "@/validators/avatar.validator";

type SettingsPictureProps = { url: string | null; name: string };

export function SettingsPicture({ url, name }: SettingsPictureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<{ file: File; opener: HTMLElement | null } | null>(null);
  const remove = useRemoveAvatar();
  const show = useToastStore((state) => state.show);

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isAvatarMimeType(file.type)) return show(messages.avatarTypeNotAllowed);
    if (file.size > AVATAR_RAW_MAX_BYTES) return show(messages.settingsCropRawTooLarge);
    setPicked({ file, opener: cameraRef.current });
  }

  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="group relative">
        <Avatar url={url} name={name} className="size-20 bg-fill text-[26px] text-time" />
        {url ? (
          <IconButton
            size="xs"
            label={messages.settingsRemovePicture}
            disabled={remove.isPending}
            className="absolute -right-1.5 -top-1.5 !size-[26px] border border-border bg-surface opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            onClick={() => remove.mutate()}
          >
            <CloseIcon size={14} />
          </IconButton>
        ) : null}
        <IconButton
          ref={cameraRef}
          size="xs"
          label={messages.settingsChangePicture}
          className="absolute -bottom-1.5 -right-1.5 !size-[26px] border border-border bg-surface"
          onClick={() => inputRef.current?.click()}
        >
          <CameraIcon size={14} />
        </IconButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={onPick}
        />
      </div>
      {picked ? (
        <SettingsCropDialog
          file={picked.file}
          opener={picked.opener}
          onClose={() => setPicked(null)}
        />
      ) : null}
    </div>
  );
}
