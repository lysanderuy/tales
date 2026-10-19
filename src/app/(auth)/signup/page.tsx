"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { collectFieldErrors, focusFirstInvalid, type FieldErrors } from "@/lib/forms/field-errors";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/validators/auth.validator";

const fieldOrder = ["displayName", "email", "password"] as const;
type FieldName = (typeof fieldOrder)[number];

export default function SignupPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<FieldName>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  function showFieldErrors(form: HTMLFormElement, errors: FieldErrors<FieldName>) {
    setFieldErrors(errors);
    focusFirstInvalid(form, errors, fieldOrder);
  }

  function clearError(name: FieldName) {
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);

    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      showFieldErrors(form, collectFieldErrors(parsed.error, fieldOrder));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const supabase = createClient();
    const { displayName, email, password } = parsed.data;
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    });

    // With email confirmation on, Supabase hides duplicates: no error, empty identities.
    if (authError?.code === "user_already_exists" || data.user?.identities?.length === 0) {
      setLoading(false);
      showFieldErrors(form, { email: messages.authEmailTaken });
      return;
    }

    if (authError) {
      setLoading(false);
      setFormError(messages.serverError);
      return;
    }

    if (data.session) {
      router.push("/today");
      router.refresh();
      return;
    }

    setLoading(false);
    setSubmittedEmail(email);
    setEmailSent(true);
  }

  async function handleResend() {
    if (!submittedEmail) return;

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: submittedEmail,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (resendError) {
      setFormError(messages.serverError);
      return;
    }

    setFormError(null);
    setResent(true);
  }

  if (emailSent) {
    return (
      <div>
        <h1 className="text-h1 font-semibold tracking-[-0.02em]">Check your email</h1>
        <p className="mt-2 text-ui text-text-soft">{messages.authCheckEmailBody}</p>
        {formError && (
          <p role="alert" className="mt-5 text-small text-danger">
            {formError}
          </p>
        )}
        <div className="mt-7 text-center">
          {resent ? (
            <p className="text-small text-text-soft">{messages.authConfirmationResent}</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="press rounded-full px-3 py-1.5 text-small font-medium text-primary hover:bg-fill"
            >
              Didn&apos;t get it? Send again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-h1 font-semibold tracking-[-0.02em]">Create your account</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
        <TextField
          label="Display name"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={60}
          placeholder="Maria Santos"
          error={fieldErrors.displayName}
          onChange={() => clearError("displayName")}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="maria@example.com"
          error={fieldErrors.email}
          onChange={() => clearError("email")}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={fieldErrors.password}
          onChange={() => clearError("password")}
        />

        {formError && (
          <p role="alert" className="text-small text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          Sign up
        </Button>
      </form>

      <p className="mt-5 text-center text-small text-text-soft">
        Already have an account?{" "}
        <Link href="/login" className="px-1 font-medium text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
