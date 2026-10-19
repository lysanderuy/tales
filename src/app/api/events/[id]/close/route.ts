import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { eventService } from "@/services/event.service";
import { closeEventSchema, eventIdParamSchema } from "@/validators/event.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = eventIdParamSchema.parse((await params).id);
    const input = closeEventSchema.parse(await request.json().catch(() => ({})));

    return apiSuccess(await eventService.close(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
