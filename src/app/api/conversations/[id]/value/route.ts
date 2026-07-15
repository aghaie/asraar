import { recordValueSignal } from '@/core/usecases/record-value-signal';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse, readJsonBody, requireBoolean } from '@/lib/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    recordValueSignal(c, id, clientKeyFrom(request, c.salt), requireBoolean(body, 'valuable'));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
