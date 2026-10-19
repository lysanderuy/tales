import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { templateService } from "@/services/template.service";
import { createTemplateSchema } from "@/validators/template.validator";

export async function GET() {
  try {
    const user = await requireUser();

    return apiSuccess(await templateService.list(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = createTemplateSchema.parse(await request.json());

    return apiSuccess(await templateService.createFromDay(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
