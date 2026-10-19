import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { blockService } from "@/services/block.service";
import { blockIdParamSchema, updateBlockSchema } from "@/validators/block.validator";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = blockIdParamSchema.parse((await params).id);
    const input = updateBlockSchema.parse(await request.json());

    return apiSuccess(await blockService.update(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = blockIdParamSchema.parse((await params).id);
    await blockService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
