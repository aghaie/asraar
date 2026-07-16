import crypto from 'node:crypto';
import { DomainError, type DomainErrorCode } from '@/core/domain/errors';

/** هش ناشناس IP — خود IP هرگز ذخیره نمی‌شود. */
export function clientKeyFrom(request: Request, salt: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'local';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/**
 * زبان مرجّح خواننده از هدر Accept-Language؛ اولین زبانِ پشتیبانی‌شده (با احترام به q).
 * اگر هیچ‌کدام پشتیبانی نشوند، رشته‌ی خالی برمی‌گردد.
 */
export function preferredLanguageFrom(
  acceptHeader: string | null,
  supported: string[],
): string {
  if (!acceptHeader) return '';
  const ranked = acceptHeader
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.split('=')[1]) : 1;
      return { lang: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 1 };
    })
    .filter((x) => x.lang.length > 0)
    .sort((a, b) => b.q - a.q);

  const supportedSet = new Set(supported);
  for (const { lang } of ranked) {
    if (supportedSet.has(lang)) return lang;
  }
  return '';
}

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  CONVERSATION_CLOSED: 409,
  TURN_LIMIT: 409,
  DUPLICATE_SIGNAL: 409,
  ENGINE_FAILURE: 503,
  CONTENT_REJECTED: 422,
};

export function errorResponse(error: unknown): Response {
  if (error instanceof DomainError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: STATUS_BY_CODE[error.code] },
    );
  }
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'unhandled error',
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  return Response.json(
    { error: { code: 'INTERNAL', message: 'خطای داخلی رخ داد.' } },
    { status: 500 },
  );
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // fallthrough
  }
  throw new DomainError('VALIDATION', 'بدنه‌ی درخواست نامعتبر است.');
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 10_000,
): string {
  const value = body[field];
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new DomainError('VALIDATION', `فیلد «${field}» نامعتبر است.`);
  }
  return value;
}

export function requireBoolean(body: Record<string, unknown>, field: string): boolean {
  const value = body[field];
  if (typeof value !== 'boolean') {
    throw new DomainError('VALIDATION', `فیلد «${field}» نامعتبر است.`);
  }
  return value;
}
