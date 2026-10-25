import { AppError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AppError(401, messages.unauthorized);
  return user;
}

// Trusts the JWT until expiry (no revocation check): read-only GET handlers only, never mutations.
export async function requireUserFast(): Promise<{ id: string; email: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) throw new AppError(401, messages.unauthorized);
  return { id: data.claims.sub, email: data.claims.email ?? null };
}
