import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailyLineService } from "@/services/daily-line.service";
import { dailyLineIdParamSchema, updateDailyLineSchema } from "@/validators/daily-set.validator";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailyLineIdParamSchema.parse((await params).id);
    const input = updateDailyLineSchema.parse(await request.json());

    return apiSuccess(await dailyLineService.updateLine(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailyLineIdParamSchema.parse((await params).id);

    await dailyLineService.removeLine(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
