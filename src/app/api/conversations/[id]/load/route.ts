import { canManage } from '@/core/domain/conversation';
import { forbidden, notFound } from '@/core/domain/errors';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import { errorResponse, optionalString, readJsonBody } from '@/lib/http';

/**
 * بارگذاری یک گفتگوی متعلق به مالک برای ادامه/تعیینِ تکلیف.
 * مالکیت با ownerToken (جریانِ ناشناس) یا هویتِ کاربرِ واردشده. بدنه: { "ownerToken"?: "…" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const ownerToken = optionalString(body, 'ownerToken', 256);
    const userId = currentUser(request)?.id ?? null;

    const { repo } = getContainer();
    const conversation = repo.findById(id);
    if (!conversation) throw notFound('گفتگو');
    if (!canManage(conversation, { ownerToken, userId })) throw forbidden();

    return Response.json({
      messages: conversation.messages.map((m) => ({ role: m.role, content: m.content })),
      branchPoint: conversation.branchPoint ?? 0,
      status: conversation.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
