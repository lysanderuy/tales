import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { todayService } from "@/services/today.service";

export async function GET() {
  try {
    const user = await requireUser();

    return apiSuccess(await todayService.getToday(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
