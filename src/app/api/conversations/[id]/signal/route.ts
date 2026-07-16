import { recordEpistemicSignal } from '@/core/usecases/record-epistemic-signal';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse, readJsonBody, requireString } from '@/lib/http';

/**
 * ثبت سیگنالِ معرفتی روی گفتگو (ADR-0022، اصل ۳): «اثر بر فهم»، نه محبوبیت.
 * بدنه: { "kind": "understood-more" | "thought-more" | … }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    recordEpistemicSignal(c, id, clientKeyFrom(request, c.salt), requireString(body, 'kind', 40));
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
