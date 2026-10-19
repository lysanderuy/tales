import { CardHeader } from "@/components/shared/card-header";
import { Card } from "@/components/ui/card";
import { Swatch } from "@/components/ui/swatch";
import { messages } from "@/lib/messages";
import { allocateMinutes, formatMinutes, secondsToMinutes } from "@/lib/today/format";
import { resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";
import type { TodayResponse } from "@/validators/today.validator";

type TimeBySubjectCardProps = {
  totalSeconds: TodayResponse["totalSeconds"];
  bySubject: TodayResponse["bySubject"];
  index: SubjectIndex;
  className?: string;
};

const unitClass = "ml-[.12em] mr-[.35em] text-body tracking-normal text-text-faint";

export function TimeBySubjectCard({
  totalSeconds,
  bySubject,
  index,
  className,
}: TimeBySubjectCardProps) {
  const entries = bySubject
    .filter((entry) => entry.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .map((entry) => ({
      ...entry,
      subject: resolveSubject(index, entry.rootId, messages.todayUnknownSubject),
    }));
  const totalMinutes = secondsToMinutes(totalSeconds);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const rowMinutes = allocateMinutes(
    entries.map((entry) => entry.seconds),
    totalSeconds,
  );

  return (
    <Card className={className}>
      <CardHeader title={messages.todayTimeBySubject} eyebrow={messages.todayEyebrowToday} />
      {entries.length === 0 ? (
        <p className="py-1 text-ui text-text-faint">{messages.todayEmpty}</p>
      ) : (
        <>
          <div className="num mb-5 text-total leading-none tracking-[-0.03em] text-time">
            {hours > 0 ? (
              <>
                {hours}
                <small className={unitClass}>h</small>
              </>
            ) : null}
            {hours === 0 || minutes > 0 ? (
              <>
                {minutes}
                <small className={unitClass}>min</small>
              </>
            ) : null}
          </div>
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-fill">
            {entries.map((entry, i) => (
              <span
                key={entry.rootId}
                title={`${entry.subject.name} ${formatMinutes(rowMinutes[i])}`}
                className="block h-full"
                style={{ flex: entry.seconds, background: entry.subject.color }}
              />
            ))}
          </div>
          <ul className="mt-3.5">
            {entries.map((entry, i) => (
              <li key={entry.rootId} className="flex items-center gap-2.5 py-[7px] text-ui">
                <Swatch color={entry.subject.color} />
                {entry.subject.name}
                <span className="num ml-auto text-text-soft">{formatMinutes(rowMinutes[i])}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
