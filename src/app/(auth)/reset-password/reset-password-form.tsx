"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/components/shared/password-field";
import { Button } from "@/components/ui/button";
import { collectFieldErrors, focusFirstInvalid } from "@/lib/forms/field-errors";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/validators/auth.validator";

const fieldOrder = ["password"] as const;

export function ResetPasswordForm() {
  const router = useRouter();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = collectFieldErrors(parsed.error, fieldOrder);
      setPasswordError(errors.password);
      focusFirstInvalid(form, errors, fieldOrder);
      return;
    }
    setPasswordError(undefined);

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (authError) {
      setLoading(false);
      setFormError(messages.serverError);
      return;
    }

    router.push("/today");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-h1 font-semibold tracking-[-0.02em]">Set a new password</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={passwordError}
          onChange={() => setPasswordError(undefined)}
        />

        {formError && (
          <p role="alert" className="text-small text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          Save password
        </Button>
      </form>
    </div>
  );
}
