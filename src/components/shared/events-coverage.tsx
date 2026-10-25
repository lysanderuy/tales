import { Swatch } from "@/components/ui/swatch";
import { markLabel, type EventMark } from "@/lib/events/marks";
import { messages } from "@/lib/messages";
import { formatPath, resolveSubject, type SubjectIndex } from "@/lib/today/subject-index";

type EventsCoverageProps = {
  coverIds: readonly string[];
  marks: Readonly<Record<string, EventMark>>;
  index: SubjectIndex;
  showMarks: boolean;
};

export function EventsCoverage({ coverIds, marks, index, showMarks }: EventsCoverageProps) {
  return (
    <ul>
      {coverIds.map((id) => {
        const info = resolveSubject(index, id, messages.todayUnknownSubject);
        const path = formatPath(info.ancestors);
        const mark = marks[id];
        return (
          <li key={id} className="flex min-h-11 items-center gap-2.5 py-[7px]">
            <Swatch color={info.color} />
            <div className="min-w-0 flex-1">
              <span title={info.name} className="block truncate text-ui font-semibold">
                {info.name}
              </span>
              {path ? (
                <span title={path} className="block truncate text-caption text-text-faint">
                  {path}
                </span>
              ) : null}
            </div>
            {showMarks && mark ? (
              <span className="shrink-0 whitespace-nowrap text-small text-text-soft">
                {markLabel(mark)}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
