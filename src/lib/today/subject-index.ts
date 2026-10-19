import type { OutlineNodeResponse } from "@/validators/outline-node.validator";

export type SubjectNodeInput = Pick<OutlineNodeResponse, "id" | "parentId" | "name" | "colorIndex">;

export interface SubjectInfo {
  id: string;
  name: string;
  ancestors: string[];
  rootId: string;
  color: string;
}

export type SubjectIndex = ReadonlyMap<string, SubjectInfo>;

export function subjectColor(colorIndex: number): string {
  return `var(--c-${colorIndex + 1})`;
}

export function buildSubjectIndex(nodes: readonly SubjectNodeInput[]): SubjectIndex {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const index = new Map<string, SubjectInfo>();

  for (const node of nodes) {
    const ancestors: string[] = [];
    const seen = new Set<string>([node.id]);
    let root = node;
    let parent = node.parentId ? byId.get(node.parentId) : undefined;
    while (parent && !seen.has(parent.id)) {
      seen.add(parent.id);
      ancestors.unshift(parent.name);
      root = parent;
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    index.set(node.id, {
      id: node.id,
      name: node.name,
      ancestors,
      rootId: root.id,
      color: subjectColor(root.colorIndex),
    });
  }

  return index;
}

export function formatPath(ancestors: readonly string[]): string {
  return ancestors.join(" › ");
}

export function resolveSubject(index: SubjectIndex, id: string, fallbackName: string): SubjectInfo {
  return (
    index.get(id) ?? { id, name: fallbackName, ancestors: [], rootId: id, color: "var(--border)" }
  );
}
