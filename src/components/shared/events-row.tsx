import { cn } from "@/lib/cn";
import { formatEventMeta, relativeDay } from "@/lib/events/dates";
import { messages } from "@/lib/messages";
import type { EventSummaryResponse } from "@/validators/event.validator";

type EventsRowProps = {
  event: EventSummaryResponse;
  today: string;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function EventsRow({ event, today, selected, onSelect }: EventsRowProps) {
  const trailing =
    event.state === "upcoming" ? (
      relativeDay(event.date, today)
    ) : event.state === "ready_to_close" ? (
      <span
        role="img"
        aria-label={messages.eventsNotMarked}
        title={messages.eventsNotMarked}
        className="inline-block size-[7px] rounded-full bg-primary"
      />
    ) : null;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(event.id)}
      className={cn(
        "-mx-3 flex w-[calc(100%+24px)] items-center gap-3 rounded-field px-3 py-2.5 text-left transition-colors hover:bg-fill",
        selected && "bg-primary-soft hover:bg-primary-soft",
      )}
    >
      <span className="min-w-0 flex-1">
        <span title={event.title} className="block truncate text-ui font-semibold">
          {event.title}
        </span>
        <span className="num block truncate text-caption text-text-faint">
          {formatEventMeta(event.date, event.time, today, event.endTime)}
        </span>
      </span>
      {trailing ? (
        <span className="num inline-flex shrink-0 items-center whitespace-nowrap text-small text-text-soft">
          {trailing}
        </span>
      ) : null}
    </button>
  );
}
