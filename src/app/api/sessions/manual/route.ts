import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { manualSessionSchema } from "@/validators/study-session.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = manualSessionSchema.parse(await request.json());

    return apiSuccess(await studySessionService.logManual(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
