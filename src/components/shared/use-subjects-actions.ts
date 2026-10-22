"use client";

import { useCreateSubject } from "@/hooks/use-create-subject";
import { useDeleteSubject } from "@/hooks/use-delete-subject";
import { useMoveSubject } from "@/hooks/use-move-subject";
import { useUpdateSubject } from "@/hooks/use-update-subject";
import { messages } from "@/lib/messages";
import type { SubjectNode } from "@/lib/subjects/tree";
import { useToastStore } from "@/stores/toast.store";

type Options = {
  showArchived: boolean;
  onSelect: (id: string | null) => void;
  onReveal: (id: string | null) => void;
};

export type SubjectActions = ReturnType<typeof useSubjectActions>;

export function useSubjectActions({ showArchived, onSelect, onReveal }: Options) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const remove = useDeleteSubject();
  const move = useMoveSubject();
  const show = useToastStore((state) => state.show);

  return {
    pending: create.isPending || update.isPending || remove.isPending,
    create(parentId: string | null, name: string, onDone: () => void) {
      create.mutate({ name, parentId: parentId ?? undefined }, { onSuccess: onDone });
    },
    rename(node: SubjectNode, name: string, onDone: () => void) {
      if (name === node.name) onDone();
      else update.mutate({ id: node.id, name }, { onSuccess: onDone });
    },
    setArchived(node: SubjectNode, archived: boolean) {
      update.mutate(
        { id: node.id, archived },
        {
          onSuccess: () => {
            show(archived ? messages.subjectsArchived : messages.subjectsRestored);
            if (archived && !showArchived) onSelect(node.parentId);
          },
        },
      );
    },
    remove(node: SubjectNode) {
      remove.mutate(node.id, {
        onSuccess: () => {
          show(messages.subjectsDeleted);
          onSelect(node.parentId);
        },
      });
    },
    setWeight(node: SubjectNode, value: number | null) {
      if (value !== node.examWeight) update.mutate({ id: node.id, examWeight: value });
    },
    move(node: SubjectNode, parentId: string | null, position?: number, quiet = false) {
      move.mutate(
        { id: node.id, parentId, position },
        {
          onSuccess: () => {
            if (!quiet) show(messages.subjectsMoved);
          },
        },
      );
      onReveal(parentId);
      onSelect(node.id);
    },
  };
}
