import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { sessionIdParamSchema } from "@/validators/study-session.validator";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = sessionIdParamSchema.parse((await params).id);

    return apiSuccess(await studySessionService.heartbeat(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
