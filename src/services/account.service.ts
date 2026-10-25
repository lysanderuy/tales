import "server-only";

import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/response";
import { env } from "@/lib/env";
import { messages } from "@/lib/messages";
import { getAdminClient } from "@/lib/supabase/admin";
import { profileService } from "@/services/profile.service";

function verifyPassword(email: string, password: string) {
  // Stateless client: verifying the password must not touch the real session cookies.
  const verifier = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return verifier.auth.signInWithPassword({ email, password });
}

export const accountService = {
  async deleteAccount(userId: string, email: string, password: string): Promise<void> {
    const { error: signInError } = await verifyPassword(email, password);
    if (signInError) throw new AppError(403, messages.accountPasswordWrong);

    try {
      await profileService.purgeAvatarObjects(userId);
    } catch {
      throw new AppError(502, messages.serverError);
    }

    const { error } = await getAdminClient().auth.admin.deleteUser(userId);
    if (error) throw error;
  },

  async changePassword(
    userId: string,
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const { error: signInError } = await verifyPassword(email, currentPassword);
    if (signInError) throw new AppError(403, messages.accountPasswordWrong);
    if (newPassword === currentPassword) throw new AppError(400, messages.accountPasswordSame);

    const { error } = await getAdminClient().auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw error;
  },
};
