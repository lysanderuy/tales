import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { sessionIdParamSchema, updateSessionSchema } from "@/validators/study-session.validator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserFast();

    const id = sessionIdParamSchema.parse((await params).id);

    return apiSuccess(await studySessionService.getById(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = sessionIdParamSchema.parse((await params).id);
    const input = updateSessionSchema.parse(await request.json());

    return apiSuccess(await studySessionService.update(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = sessionIdParamSchema.parse((await params).id);
    await studySessionService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
