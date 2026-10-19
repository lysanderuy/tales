import { z } from "zod";

const email = z.string().trim().min(1, "Enter your email.").pipe(z.email("Enter a valid email."));
const newPassword = z.string().min(8, "Password needs at least 8 characters.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a display name.").max(60),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  password: newPassword,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
