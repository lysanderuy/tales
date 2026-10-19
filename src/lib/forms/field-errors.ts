import { z } from "zod";

export type FieldErrors<Name extends string> = Partial<Record<Name, string>>;

export function collectFieldErrors<Name extends string>(
  error: z.ZodError,
  order: readonly Name[],
): FieldErrors<Name> {
  const flat: Record<string, string[] | undefined> = z.flattenError(error).fieldErrors;
  const errors: FieldErrors<Name> = {};
  for (const name of order) {
    const message = flat[name]?.[0];
    if (message) errors[name] = message;
  }
  return errors;
}

export function firstInvalidField<Name extends string>(
  errors: FieldErrors<Name>,
  order: readonly Name[],
): Name | undefined {
  return order.find((name) => errors[name]);
}

export function focusFirstInvalid<Name extends string>(
  form: HTMLFormElement,
  errors: FieldErrors<Name>,
  order: readonly Name[],
) {
  const name = firstInvalidField(errors, order);
  if (name) form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.focus();
}
