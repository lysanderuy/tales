import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "fill";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90",
  fill: "bg-fill text-text hover:bg-fill-hover",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string): string {
  return cn(
    "press inline-flex items-center justify-center gap-2 rounded-full px-[30px] py-3 text-body font-medium disabled:opacity-50",
    variants[variant],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
