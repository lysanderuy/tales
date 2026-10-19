import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type EyebrowProps = HTMLAttributes<HTMLElement> & { as?: ElementType };

export function Eyebrow({ as: Tag = "span", className, ...props }: EyebrowProps) {
  return <Tag className={cn("eyebrow", className)} {...props} />;
}
