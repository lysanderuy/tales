import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailyLineService } from "@/services/daily-line.service";
import { createDailyLineSchema, dailySetIdParamSchema } from "@/validators/daily-set.validator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);

    return apiSuccess(await dailyLineService.listLines(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = dailySetIdParamSchema.parse((await params).id);
    const input = createDailyLineSchema.parse(await request.json());

    return apiSuccess(await dailyLineService.addLine(user.id, id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
