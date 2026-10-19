import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailySetService } from "@/services/daily-set.service";
import { dailySetActivationSchema, dailySetIdParamSchema } from "@/validators/daily-set.validator";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);
    const input = dailySetActivationSchema.parse(await request.json());

    return apiSuccess(await dailySetService.setActive(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
