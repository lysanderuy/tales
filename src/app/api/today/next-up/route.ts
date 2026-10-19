import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { todayService } from "@/services/today.service";
import { nextUpQuerySchema } from "@/validators/today.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const query = nextUpQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    return apiSuccess(await todayService.nextUp(user.id, query.excludeBlockId));
  } catch (error) {
    return handleApiError(error);
  }
}
