import { requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";

export async function GET() {
  try {
    const user = await requireUserFast();

    return apiSuccess(await studySessionService.getCurrent(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
