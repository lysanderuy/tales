"use client";

import { DialogShell } from "@/components/shared/dialog-shell";
import { EditRecordForm } from "@/components/shared/edit-record-form";
import { CloseIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/hooks/use-session";
import { messages } from "@/lib/messages";

type EditRecordDialogProps = {
  recordId: string;
  opener: HTMLElement | null;
  onClose: () => void;
};

export function EditRecordDialog({ recordId, opener, onClose }: EditRecordDialogProps) {
  const record = useSession(recordId);
  const profile = useProfile();
  const failed = record.isError || profile.isError;

  return (
    <DialogShell label={messages.editTitle} opener={opener} onClose={onClose}>
      {(onOverlayChange) =>
        record.data && profile.data ? (
          <EditRecordForm
            record={record.data}
            timeZone={profile.data.timeZone}
            onClose={onClose}
            onOverlayChange={onOverlayChange}
          />
        ) : (
          <div className="pt-6">
            {failed ? (
              <p role="alert" className="text-small text-danger">
                {messages.serverError}
              </p>
            ) : (
              <p className="text-small text-text-faint">{messages.editLoading}</p>
            )}
            <div className="mt-4 flex justify-end">
              <IconButton label={messages.editCancel} onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </div>
          </div>
        )
      }
    </DialogShell>
  );
}
