import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailySetService } from "@/services/daily-set.service";
import { dailySetIdParamSchema, renameDailySetSchema } from "@/validators/daily-set.validator";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);
    const input = renameDailySetSchema.parse(await request.json());

    return apiSuccess(await dailySetService.rename(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);

    await dailySetService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
