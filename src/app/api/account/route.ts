import { requireUser } from "@/lib/api/auth";
import { AppError, apiSuccess, handleApiError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { accountService } from "@/services/account.service";
import { deleteAccountSchema } from "@/validators/account.validator";

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { password } = deleteAccountSchema.parse(await request.json());
    if (!user.email) throw new AppError(403, messages.accountPasswordWrong);
    await accountService.deleteAccount(user.id, user.email, password);
    const supabase = await createClient();
    await supabase.auth.signOut();
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
