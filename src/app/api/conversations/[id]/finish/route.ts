import { finishConversation } from '@/core/usecases/finish-conversation';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import { errorResponse, optionalString, readJsonBody, requireBoolean } from '@/lib/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    const result = await finishConversation(c, {
      conversationId: id,
      ownerToken: optionalString(body, 'ownerToken', 256),
      userId: currentUser(request)?.id ?? null,
      publish: requireBoolean(body, 'publish'),
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
