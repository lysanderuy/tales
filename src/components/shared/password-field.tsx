"use client";

import { forwardRef, useState } from "react";
import type { ComponentProps } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import { messages } from "@/lib/messages";

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "trailing">;

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        type={visible ? "text" : "password"}
        trailing={
          <IconButton
            size="sm"
            variant="fill"
            className="bg-transparent text-text-soft hover:bg-fill-hover"
            label={visible ? messages.passwordHide : messages.passwordShow}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <svg {...iconProps}>
                <path d="M3 3l18 18M10.2 6a9.6 9.6 0 0 1 1.8-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.5 7.6A16.5 16.5 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4-.9M9.9 9.9a2.8 2.8 0 0 0 4 4" />
              </svg>
            ) : (
              <svg {...iconProps}>
                <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                <circle cx="12" cy="12" r="2.8" />
              </svg>
            )}
          </IconButton>
        }
        {...props}
      />
    );
  },
);
