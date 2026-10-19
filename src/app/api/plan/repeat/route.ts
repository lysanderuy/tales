import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { planCopyService } from "@/services/plan-copy.service";
import { repeatDaySchema } from "@/validators/plan-copy.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = repeatDaySchema.parse(await request.json());

    return apiSuccess(await planCopyService.repeat(user.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
