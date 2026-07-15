import { finishConversation } from '@/core/usecases/finish-conversation';
import { getContainer } from '@/infrastructure/container';
import { errorResponse, readJsonBody, requireBoolean, requireString } from '@/lib/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    const result = finishConversation(c, {
      conversationId: id,
      ownerToken: requireString(body, 'ownerToken', 256),
      publish: requireBoolean(body, 'publish'),
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
