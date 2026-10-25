import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { eventService } from "@/services/event.service";
import { createEventSchema, listEventsQuerySchema } from "@/validators/event.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUserFast();

    const query = listEventsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await eventService.list(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = createEventSchema.parse(await request.json());

    return apiSuccess(await eventService.create(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
