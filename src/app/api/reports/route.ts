import { requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { reportService } from "@/services/report.service";
import { reportQuerySchema } from "@/validators/report.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUserFast();

    const query = reportQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));

    return apiSuccess(await reportService.get(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
