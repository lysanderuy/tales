import { requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { pickerService } from "@/services/picker.service";
import { pickerQuerySchema } from "@/validators/today.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUserFast();

    const query = pickerQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    return apiSuccess(await pickerService.get(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
