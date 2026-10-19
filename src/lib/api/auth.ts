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
