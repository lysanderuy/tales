import { requireUser, requireUserFast } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { outlineNodeService } from "@/services/outline-node.service";
import {
  createOutlineNodeSchema,
  listOutlineNodesQuerySchema,
} from "@/validators/outline-node.validator";

export async function GET(request: Request) {
  try {
    const user = await requireUserFast();

    const query = listOutlineNodesQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );

    return apiSuccess(await outlineNodeService.list(user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const input = createOutlineNodeSchema.parse(await request.json());

    return apiSuccess(await outlineNodeService.create(user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
