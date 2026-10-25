"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DialogShell } from "@/components/shared/dialog-shell";
import { failureText } from "@/components/shared/form-parts";
import { SettingsCropStage } from "@/components/shared/settings-crop-stage";
import { Button } from "@/components/ui/button";
import { useUploadAvatar } from "@/hooks/use-upload-avatar";
import { messages } from "@/lib/messages";
import type { Rect } from "@/lib/settings/crop";
import {
  decodeImage,
  ImageTooBigError,
  renderCrop,
  type DecodedImage,
} from "@/lib/settings/crop-export";
import { useToastStore } from "@/stores/toast.store";

type SettingsCropDialogProps = { file: File; opener: HTMLElement | null; onClose: () => void };

export function SettingsCropDialog({ file, opener, onClose }: SettingsCropDialogProps) {
  const upload = useUploadAvatar({ toastOnError: false });
  const show = useToastStore((state) => state.show);
  const [image, setImage] = useState<DecodedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const regionRef = useRef<Rect | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    let decoded: DecodedImage | null = null;
    decodeImage(file).then(
      (result) => {
        if (cancelled) return result.release();
        decoded = result;
        setImage(result);
      },
      (failure) => {
        if (cancelled) return;
        show(
          failure instanceof ImageTooBigError
            ? messages.settingsCropImageTooBig
            : messages.settingsCropDecodeFailed,
        );
        onCloseRef.current();
      },
    );
    return () => {
      cancelled = true;
      decoded?.release();
    };
  }, [file, show]);

  const onRegionChange = useCallback((region: Rect) => {
    regionRef.current = region;
  }, []);

  async function onSave() {
    const region = regionRef.current;
    if (!image || !region) return;
    setError(null);
    setBusy(true);
    try {
      const cropped = await renderCrop(image, region);
      if (cropped === "tooLarge") return setError(messages.avatarTooLarge);
      if (cropped === "failed") return setError(messages.settingsCropSaveFailed);
      await upload.mutateAsync(cropped);
      show(messages.settingsSaved);
      onClose();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogShell label={messages.settingsCropTitle} opener={opener} onClose={onClose}>
      {() => (
        <div className="mt-6">
          <h2 className="mb-5 text-h2 font-semibold tracking-[-0.01em]">
            {messages.settingsCropTitle}
          </h2>
          {image ? (
            <SettingsCropStage url={image.url} size={image.size} onRegionChange={onRegionChange} />
          ) : (
            <div className="mx-auto aspect-square w-full max-w-[400px] rounded-field bg-fill" />
          )}
          {error ? (
            <p role="alert" className="mt-3 text-ui text-danger">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="fill" onClick={onClose}>
              {messages.settingsCancel}
            </Button>
            <Button disabled={!image || busy} aria-busy={busy} onClick={() => void onSave()}>
              {messages.settingsCropSave}
            </Button>
          </div>
        </div>
      )}
    </DialogShell>
  );
}
