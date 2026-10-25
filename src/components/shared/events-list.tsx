import { EventsRow } from "@/components/shared/events-row";
import { Eyebrow } from "@/components/ui/eyebrow";
import { messages } from "@/lib/messages";
import type { EventSummaryResponse } from "@/validators/event.validator";

type EventsListProps = {
  upcoming: readonly EventSummaryResponse[];
  past: readonly EventSummaryResponse[];
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EventsList({ upcoming, past, today, selectedId, onSelect }: EventsListProps) {
  const sections = [
    { label: messages.eventsUpcoming, events: upcoming },
    { label: messages.eventsPast, events: past },
  ].filter((section) => section.events.length > 0);

  return (
    <div className="flex flex-col gap-[22px]">
      {sections.map((section) => (
        <section key={section.label}>
          <Eyebrow as="div" className="mb-1.5">
            {section.label}
          </Eyebrow>
          {section.events.map((event) => (
            <EventsRow
              key={event.id}
              event={event}
              today={today}
              selected={event.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
