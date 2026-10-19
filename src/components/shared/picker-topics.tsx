import { ChevronLeftIcon } from "@/components/shared/icons";
import { PickerRowButton } from "@/components/shared/picker-row";
import { messages } from "@/lib/messages";
import { isPicked, type PickerSelection, type TopicRow } from "@/lib/picker/picker";

const INDENT_PER_LEVEL = 16;

type PickerTopicsProps = {
  topics: readonly TopicRow[];
  selected: PickerSelection;
  onBack?: () => void;
  onPick: (nodeId: string) => void;
};

export function PickerTopics({ topics, selected, onBack, onPick }: PickerTopicsProps) {
  return (
    <>
      {onBack ? (
        <button
          type="button"
          data-picker-row=""
          onClick={onBack}
          className="eyebrow flex w-full items-center gap-1.5 px-3.5 pb-1 pt-3 text-left focus-visible:outline-offset-[-2px]"
        >
          <ChevronLeftIcon />
          {messages.pickerSubjects}
        </button>
      ) : null}
      {topics.map((topic) => (
        <PickerRowButton
          key={topic.nodeId}
          name={topic.name}
          strong={topic.isParent}
          indent={topic.depth * INDENT_PER_LEVEL}
          checked={isPicked({ nodeId: topic.nodeId, blockId: null }, selected)}
          onClick={() => onPick(topic.nodeId)}
        />
      ))}
    </>
  );
}
