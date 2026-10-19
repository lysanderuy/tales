import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { blockService } from "@/services/block.service";
import { reorderBlocksSchema } from "@/validators/block.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = reorderBlocksSchema.parse(await request.json());

    return apiSuccess(await blockService.reorder(user.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
