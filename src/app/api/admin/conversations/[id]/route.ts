import { isModerationAction, moderate } from '@/core/usecases/admin/admin-usecases';
import { getContainer } from '@/infrastructure/container';
import { adminFromRequest } from '@/lib/admin';
import { errorResponse, readJsonBody } from '@/lib/http';

/**
 * کنشِ نظارتی بر یک گفتگو (ADR-0026) — فقط برای ادمین.
 * بدنه: { "action": "unpublish" | "republish" | "delete" }
 * هیچ کنشی علیهِ کاربر نیست؛ فقط محتوا (ADR-0006).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    if (!adminFromRequest(request)) {
      return Response.json({ error: { message: 'forbidden' } }, { status: 403 });
    }
    const { id } = await params;
    const body = await readJsonBody(request);
    const action = body.action;
    if (!isModerationAction(action)) {
      return Response.json({ error: { message: 'bad action' } }, { status: 400 });
    }
    moderate({ repo: getContainer().repo }, id, action);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
