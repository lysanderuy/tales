import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { outlineNodeService } from "@/services/outline-node.service";
import { nodeIdParamSchema, updateOutlineNodeSchema } from "@/validators/outline-node.validator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();

    const id = nodeIdParamSchema.parse((await params).id);
    const input = updateOutlineNodeSchema.parse(await request.json());

    return apiSuccess(await outlineNodeService.update(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();

    const id = nodeIdParamSchema.parse((await params).id);
    await outlineNodeService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
