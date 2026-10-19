import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { outlineNodeService } from "@/services/outline-node.service";
import { moveOutlineNodeSchema, nodeIdParamSchema } from "@/validators/outline-node.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = nodeIdParamSchema.parse((await params).id);
    const input = moveOutlineNodeSchema.parse(await request.json());

    return apiSuccess(await outlineNodeService.move(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
