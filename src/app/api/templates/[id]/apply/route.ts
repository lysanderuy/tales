import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { templateService } from "@/services/template.service";
import { applyTemplateSchema, templateIdParamSchema } from "@/validators/template.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = templateIdParamSchema.parse((await params).id);
    const input = applyTemplateSchema.parse(await request.json());

    return apiSuccess(await templateService.apply(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
