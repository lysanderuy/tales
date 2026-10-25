import { requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { dailyLineService } from "@/services/daily-line.service";

export async function GET() {
  try {
    const user = await requireUserFast();

    return apiSuccess(await dailyLineService.getTodaysLine(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
