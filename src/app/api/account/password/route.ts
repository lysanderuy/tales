import { requireUser } from "@/lib/api/auth";
import { AppError, apiSuccess, handleApiError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { accountService } from "@/services/account.service";
import { changePasswordSchema } from "@/validators/account.validator";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const { currentPassword, newPassword } = changePasswordSchema.parse(await request.json());
    if (!user.email) throw new AppError(403, messages.accountPasswordWrong);
    await accountService.changePassword(user.id, user.email, currentPassword, newPassword);
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) console.error("Could not sign out other sessions", error);
    return apiSuccess({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
