import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { templateService } from "@/services/template.service";
import { renameTemplateSchema, templateIdParamSchema } from "@/validators/template.validator";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = templateIdParamSchema.parse((await params).id);
    const input = renameTemplateSchema.parse(await request.json());

    return apiSuccess(await templateService.rename(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = templateIdParamSchema.parse((await params).id);
    await templateService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
