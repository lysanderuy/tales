import type { ReactNode } from "react";

import { Eyebrow } from "@/components/ui/eyebrow";

type CardHeaderProps = { title: string; eyebrow?: string; action?: ReactNode };

export function CardHeader({ title, eyebrow, action }: CardHeaderProps) {
  return (
    <div className={`mb-4 flex justify-between ${action ? "items-center" : "items-baseline"}`}>
      <h2 className="text-h2 font-semibold tracking-[-0.01em]">{title}</h2>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      {action}
    </div>
  );
}
