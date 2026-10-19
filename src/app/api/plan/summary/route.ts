import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { blockService } from "@/services/block.service";
import { planSummaryQuerySchema } from "@/validators/block.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const query = planSummaryQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await blockService.summary(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
