import { claimConversation } from '@/core/usecases/auth/claim-conversation';
import { DomainError } from '@/core/domain/errors';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import { errorResponse, readJsonBody, requireString } from '@/lib/http';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = currentUser(request);
    if (!user) throw new DomainError('FORBIDDEN', 'ابتدا وارد شوید.');
    const body = await readJsonBody(request);
    const c = getContainer();
    claimConversation(
      c.repo,
      requireString(body, 'conversationId', 100),
      requireString(body, 'ownerToken', 256),
      user.id,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
