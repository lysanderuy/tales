import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailyLineService } from "@/services/daily-line.service";
import { dailyLineIdParamSchema } from "@/validators/daily-set.validator";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailyLineIdParamSchema.parse((await params).id);

    return apiSuccess(await dailyLineService.unhide(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
