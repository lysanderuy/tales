import { requireUser } from "@/lib/api/auth";
import { AppError, apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { messages } from "@/lib/messages";
import { profileService } from "@/services/profile.service";
import { AVATAR_MAX_BYTES, AVATAR_REQUEST_OVERHEAD_BYTES } from "@/validators/avatar.validator";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const length = Number(request.headers.get("content-length"));
    if (length > AVATAR_MAX_BYTES + AVATAR_REQUEST_OVERHEAD_BYTES) {
      throw new AppError(413, messages.avatarTooLarge);
    }

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new AppError(400, messages.avatarMissing);

    const profile = await profileService.setAvatar(user.id, file);
    if (!profile) return apiError(messages.profileNotFound, 404);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();

    const profile = await profileService.removeAvatar(user.id);
    if (!profile) return apiError(messages.profileNotFound, 404);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
