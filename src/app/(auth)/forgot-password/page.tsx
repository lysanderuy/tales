"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/validators/auth.validator";

export default function ForgotPasswordPage() {
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setEmailError(z.flattenError(parsed.error).fieldErrors.email?.[0]);
      form.querySelector<HTMLInputElement>('[name="email"]')?.focus();
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    const supabase = createClient();
    // The reply is the same whether or not the email has an account, so the result is ignored.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    setSentTo(parsed.data.email);
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
