import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { eventService } from "@/services/event.service";
import { eventIdParamSchema, updateEventSchema } from "@/validators/event.validator";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserFast();

    const id = eventIdParamSchema.parse((await params).id);

    return apiSuccess(await eventService.get(user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = eventIdParamSchema.parse((await params).id);
    const input = updateEventSchema.parse(await request.json());

    return apiSuccess(await eventService.update(user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = eventIdParamSchema.parse((await params).id);
    await eventService.remove(user.id, id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
