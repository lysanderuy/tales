import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { blockService } from "@/services/block.service";
import { createBlockSchema, listBlocksQuerySchema } from "@/validators/block.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUserFast();

    const query = listBlocksQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await blockService.list(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = createBlockSchema.parse(await request.json());

    return apiSuccess(await blockService.create(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
