import { getTranslatedConversation } from '@/core/usecases/get-translated-conversation';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse } from '@/lib/http';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const lang = new URL(request.url).searchParams.get('lang') ?? '';
    const c = getContainer();
    const result = await getTranslatedConversation(
      { repo: c.repo, translator: c.translator, store: c.translationStore, rateLimiter: c.rateLimiter, now: c.now },
      id,
      lang,
      clientKeyFrom(request, c.salt),
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
