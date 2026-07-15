import { startConversation } from '@/core/usecases/start-conversation';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse } from '@/lib/http';

export async function POST(request: Request): Promise<Response> {
  try {
    const c = getContainer();
    const result = startConversation(c, clientKeyFrom(request, c.salt));
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
