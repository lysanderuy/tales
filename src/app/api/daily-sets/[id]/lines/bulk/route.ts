import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailyLineService } from "@/services/daily-line.service";
import { bulkDailyLinesSchema, dailySetIdParamSchema } from "@/validators/daily-set.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);
    const input = bulkDailyLinesSchema.parse(await request.json());

    return apiSuccess(await dailyLineService.bulkAdd(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
