import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailySetService } from "@/services/daily-set.service";
import { createDailySetSchema } from "@/validators/daily-set.validator";

export async function GET() {
  try {
    const user = await requireUserFast();

    return apiSuccess(await dailySetService.list(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = createDailySetSchema.parse(await request.json());

    return apiSuccess(await dailySetService.create(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
