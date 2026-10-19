import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { studySessionService } from "@/services/study-session.service";
import { listSessionsQuerySchema, startSessionSchema } from "@/validators/study-session.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const query = listSessionsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await studySessionService.list(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = startSessionSchema.parse(await request.json().catch(() => ({})));

    const { session, created } = await studySessionService.start(user.id, input);
    return apiSuccess(session, created ? 201 : 200);
  } catch (error) {
    return handleApiError(error);
  }
}
