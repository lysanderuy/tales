import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { planCopyService } from "@/services/plan-copy.service";
import { copyDaySchema } from "@/validators/plan-copy.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = copyDaySchema.parse(await request.json());

    return apiSuccess(await planCopyService.copy(user.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
