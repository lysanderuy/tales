import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { outlineNodeService } from "@/services/outline-node.service";
import { reorderOutlineNodesSchema } from "@/validators/outline-node.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = reorderOutlineNodesSchema.parse(await request.json());

    return apiSuccess(await outlineNodeService.reorder(user.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
