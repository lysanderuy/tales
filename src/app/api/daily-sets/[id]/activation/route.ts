import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailySetService } from "@/services/daily-set.service";
import { dailySetIdParamSchema } from "@/validators/daily-set.validator";

export async function PUT(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);

    return apiSuccess(await dailySetService.select(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
