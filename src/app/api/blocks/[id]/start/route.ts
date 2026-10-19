import { requireUser } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { blockService } from "@/services/block.service";
import { blockIdParamSchema, startBlockSchema } from "@/validators/block.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();

    const id = blockIdParamSchema.parse((await params).id);
    const input = startBlockSchema.parse(await request.json().catch(() => ({})));

    const { session, created } = await blockService.start(user.id, id, input);
    return apiSuccess(session, created ? 201 : 200);
  } catch (error) {
    return handleApiError(error);
  }
}
