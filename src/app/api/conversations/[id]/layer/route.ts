import { getAnswerLayer } from '@/core/usecases/get-answer-layer';
import { DomainError } from '@/core/domain/errors';
import { getContainer } from '@/infrastructure/container';
import { clientKeyFrom, errorResponse } from '@/lib/http';

/**
 * لایه‌ی درخواستیِ یک پاسخ (ADR-0022، اصل ۴): استدلال یا مبنای قرآنی.
 * GET ?seq=4&layer=reasoning|quranic
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const seq = Number.parseInt(url.searchParams.get('seq') ?? '', 10);
    const layer = url.searchParams.get('layer') ?? '';
    if (!Number.isFinite(seq) || seq < 1) {
      throw new DomainError('VALIDATION', 'نوبت نامعتبر است.');
    }
    const c = getContainer();
    const result = await getAnswerLayer(
      {
        repo: c.repo,
        builder: c.answerLayerBuilder,
        store: c.answerLayerStore,
        rateLimiter: c.rateLimiter,
        now: c.now,
      },
      id,
      seq,
      layer,
      clientKeyFrom(request, c.salt),
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
