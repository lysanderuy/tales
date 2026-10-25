import { z } from "zod";

export const deleteAccountSchema = z
  .object({ password: z.string().min(1, "Enter your password.") })
  .meta({ id: "DeleteAccountRequest" });

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").meta({
      description: "The password you use now.",
    }),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Use 72 characters or fewer.")
      .meta({ description: "The new password, 8 to 72 characters." }),
  })
  .meta({ id: "ChangePasswordRequest" });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
