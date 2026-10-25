import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { profileService } from "@/services/profile.service";
import { updateProfileSchema } from "@/validators/profile.validator";

export async function GET() {
  try {
    const user = await requireUserFast();

    const profile = await profileService.getById(user.id);
    if (!profile) return apiError(messages.profileNotFound, 404);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();

    const input = updateProfileSchema.parse(await request.json());

    const profile = await profileService.update(user.id, input);
    if (!profile) return apiError(messages.profileNotFound, 404);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
