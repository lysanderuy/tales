"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { collectFieldErrors, focusFirstInvalid, type FieldErrors } from "@/lib/forms/field-errors";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/validators/auth.validator";

const callbackErrorMessages = new Map([["callback_failed", messages.authCallbackFailed]]);

const fieldOrder = ["email", "password"] as const;
type FieldName = (typeof fieldOrder)[number];

// useSearchParams requires a Suspense boundary above it.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  // /api/auth/callback redirects here with ?error=; only known values are shown.
  const callbackError = callbackErrorMessages.get(useSearchParams().get("error") ?? "") ?? null;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<FieldName>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const displayError = error ?? (resent ? null : callbackError);

  function clearError(name: FieldName) {
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setUnconfirmedEmail(null);
    setResent(false);

    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = collectFieldErrors(parsed.error, fieldOrder);
      setFieldErrors(errors);
      focusFirstInvalid(form, errors, fieldOrder);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

    if (authError) {
      setLoading(false);
      if (authError.code === "email_not_confirmed") {
        setUnconfirmedEmail(parsed.data.email);
        setError(messages.authEmailNotConfirmed);
      } else if (authError.code === "invalid_credentials") {
        setError(messages.authInvalidCredentials);
      } else {
        setError(messages.serverError);
      }
      return;
    }

    router.push("/today");
    router.refresh();
  }

  async function handleResend() {
    if (!unconfirmedEmail) return;

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (resendError) {
      setError(messages.serverError);
      return;
    }

    setError(null);
    setResent(true);
  }

  return (
    <div>
      <h1 className="text-h1 font-semibold tracking-[-0.02em]">Welcome back</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="maria@example.com"
          error={fieldErrors.email}
          onChange={() => clearError("email")}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={fieldErrors.password}
            onChange={() => clearError("password")}
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="rounded-full px-3 py-1.5 text-small text-text-faint hover:bg-fill hover:text-text-soft"
            >
              Forgot password
            </Link>
          </div>
        </div>

        {displayError && (
          <p role="alert" className="text-small text-danger">
            {displayError}
          </p>
        )}
        {unconfirmedEmail && !resent && (
          <button
            type="button"
            onClick={handleResend}
            className="press self-start rounded-full px-3 py-1.5 text-small font-medium text-primary hover:bg-fill"
          >
            Send confirmation email again
          </button>
        )}
        {resent && <p className="text-small text-text-soft">{messages.authConfirmationSent}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-small text-text-soft">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="px-1 font-medium text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
