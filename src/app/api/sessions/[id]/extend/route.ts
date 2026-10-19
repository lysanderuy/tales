import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { extendSessionSchema, sessionIdParamSchema } from "@/validators/study-session.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = sessionIdParamSchema.parse((await params).id);
    const input = extendSessionSchema.parse(await request.json());

    return apiSuccess(await studySessionService.extend(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
