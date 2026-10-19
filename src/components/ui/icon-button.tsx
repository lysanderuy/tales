import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type IconButtonSize = "xs" | "sm" | "md";
export type IconButtonVariant = "fill" | "tint" | "solid";

const sizes: Record<IconButtonSize, string> = {
  xs: "size-[34px]",
  sm: "size-10",
  md: "size-11",
};

const variants: Record<IconButtonVariant, string> = {
  fill: "bg-fill text-text hover:bg-fill-hover",
  tint: "bg-primary-soft text-primary hover:opacity-80",
  solid: "bg-primary text-on-primary hover:opacity-90",
};

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "aria-label"> & {
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "fill", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      className={cn(
        "press inline-flex shrink-0 items-center justify-center rounded-full disabled:opacity-50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
