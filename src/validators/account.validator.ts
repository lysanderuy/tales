import { z } from "zod";

export const deleteAccountSchema = z
  .object({ password: z.string().min(1, "Enter your password.") })
  .meta({ id: "DeleteAccountRequest" });

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
