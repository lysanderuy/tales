"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { collectFieldErrors, focusFirstInvalid } from "@/lib/forms/field-errors";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/validators/auth.validator";

const fieldOrder = ["email"] as const;

export default function ForgotPasswordPage() {
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);

    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = collectFieldErrors(parsed.error, fieldOrder);
      setEmailError(errors.email);
      focusFirstInvalid(form, errors, fieldOrder);
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${location.origin}/api/auth/callback?next=/reset-password`,
      });
      if (error) {
        setFormError(messages.serverError);
        return;
      }
      setSentTo(parsed.data.email);
    } catch {
      setFormError(messages.serverError);
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div>
        <h1 className="text-h1 font-semibold tracking-[-0.02em]">Check your email</h1>
        <p className="mt-2 text-ui text-text-soft">{messages.authResetSent(sentTo)}</p>
        <p className="mt-7 text-center text-small">
          <Link href="/login" className="px-1 font-medium text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h1 font-semibold tracking-[-0.02em]">Reset your password</h1>
      <p className="mt-2 text-ui text-text-soft">{messages.authResetIntro}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="maria@example.com"
          error={emailError}
          onChange={() => setEmailError(undefined)}
        />

        {formError && (
          <p role="alert" className="text-small text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          Send email
        </Button>
      </form>

      <p className="mt-5 text-center text-small">
        <Link href="/login" className="px-1 font-medium text-primary">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
