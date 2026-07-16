import { branchConversation } from '@/core/usecases/branch-conversation';
import { DomainError } from '@/core/domain/errors';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import { clientKeyFrom, errorResponse, readJsonBody } from '@/lib/http';

/**
 * شاخه‌زدن از یک گفتگوی منتشرشده (ADR-0022، اصل ۲).
 * بدنه: { "parentId": "…", "branchPoint": 2 }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const parentId = body.parentId;
    const branchPoint = body.branchPoint;
    if (typeof parentId !== 'string' || typeof branchPoint !== 'number') {
      throw new DomainError('VALIDATION', 'ورودی نامعتبر است.');
    }
    const c = getContainer();
    const user = currentUser(request);
    const result = branchConversation(c, {
      parentId,
      branchPoint,
      clientKey: clientKeyFrom(request, c.salt),
      userId: user?.id ?? null,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
