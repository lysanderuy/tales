import "server-only";

import { createClient } from "@supabase/supabase-js";

import { AppError } from "@/lib/api/response";
import { env } from "@/lib/env";
import { messages } from "@/lib/messages";
import { getAdminClient } from "@/lib/supabase/admin";

export const accountService = {
  async deleteAccount(userId: string, email: string, password: string): Promise<void> {
    // Stateless client: verifying the password must not touch the real session cookies.
    const verifier = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await verifier.auth.signInWithPassword({ email, password });
    if (signInError) throw new AppError(403, messages.accountPasswordWrong);

    const { error } = await getAdminClient().auth.admin.deleteUser(userId);
    if (error) throw error;
  },
};
