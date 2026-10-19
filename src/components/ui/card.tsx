import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & { as?: ElementType };

export function Card({ as: Tag = "section", className, ...props }: CardProps) {
  return (
    <Tag
      className={cn("rounded-card border border-border bg-surface p-6", className)}
      {...props}
    />
  );
}
