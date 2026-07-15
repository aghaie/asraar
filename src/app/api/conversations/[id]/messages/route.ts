import { LIMITS } from '@/core/domain/conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse, readJsonBody, requireString } from '@/lib/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    const result = await sendMessage(c, {
      conversationId: id,
      ownerToken: requireString(body, 'ownerToken', 256),
      content: requireString(body, 'content', LIMITS.maxMessageChars + 1000),
      clientKey: clientKeyFrom(request, c.salt),
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
