import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { accountService } from "@/services/account.service";

export async function DELETE() {
  try {
    const user = await requireUser();
    await accountService.deleteAccount(user.id);

    const supabase = await createClient();
    await supabase.auth.signOut();

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
