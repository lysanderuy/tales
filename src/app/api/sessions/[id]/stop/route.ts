import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { sessionIdParamSchema, stopSessionSchema } from "@/validators/study-session.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = sessionIdParamSchema.parse((await params).id);
    const input = stopSessionSchema.parse(await request.json().catch(() => ({})));

    return apiSuccess(await studySessionService.stop(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
