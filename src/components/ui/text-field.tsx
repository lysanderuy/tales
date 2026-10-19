import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "aria-invalid"> & {
  label: string;
  error?: string;
  trailing?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, trailing, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="eyebrow">
        {label}
      </label>
      <div className="flex min-h-[52px] items-center gap-2 rounded-field bg-fill pr-2 transition-colors hover:bg-fill-hover">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "min-h-[52px] min-w-0 flex-1 bg-transparent px-4 text-body text-text outline-none placeholder:text-text-faint",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
