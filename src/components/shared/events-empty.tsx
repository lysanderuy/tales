import { PlusIcon } from "@/components/shared/icons";
import { IconButton } from "@/components/ui/icon-button";
import { messages } from "@/lib/messages";

export function EventsEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-0 pb-10 pt-12 text-center">
      <p className="mb-5 py-1 text-ui text-text-faint">{messages.eventsEmpty}</p>
      <IconButton variant="solid" label={messages.eventsAddEvent} onClick={onAdd}>
        <PlusIcon />
      </IconButton>
    </div>
  );
}
