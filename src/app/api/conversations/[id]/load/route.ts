import { forbidden, notFound } from '@/core/domain/errors';
import { getContainer } from '@/infrastructure/container';
import { errorResponse, readJsonBody, requireString } from '@/lib/http';

/**
 * بارگذاری یک گفتگوی فعالِ متعلق به مالک (برای ادامه‌ی شاخه در سمت کاربر).
 * بدنه: { "ownerToken": "…" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const ownerToken = requireString(body, 'ownerToken', 256);

    const { repo } = getContainer();
    const conversation = repo.findById(id);
    if (!conversation) throw notFound('گفتگو');
    if (conversation.ownerToken !== ownerToken) throw forbidden();

    return Response.json({
      messages: conversation.messages.map((m) => ({ role: m.role, content: m.content })),
      branchPoint: conversation.branchPoint ?? 0,
      status: conversation.status,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
