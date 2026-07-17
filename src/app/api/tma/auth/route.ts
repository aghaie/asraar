import { verifyInitData } from '@/core/domain/telegram-auth';
import { completeTelegramLogin } from '@/core/usecases/auth/auth-service';
import { getContainer } from '@/infrastructure/container';
import { authDeps, sessionCookie } from '@/lib/auth';
import { errorResponse } from '@/lib/http';

/** بیشینه‌ی عمرِ مجازِ initData (۲۴ ساعت) — پرهیز از بازپخشِ کهنه. */
const MAX_AGE_SECONDS = 24 * 3600;

/**
 * ورودِ مینی‌اپِ تلگرام (ADR-0027): initData را می‌گیرد، آفلاین اعتبارسنجی می‌کند،
 * کاربر را می‌یابد/می‌سازد و کوکیِ نشستِ مناد را ست می‌کند. هیچ تماسی با api.telegram.org ندارد.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const c = getContainer();
    if (!c.telegram) {
      return Response.json(
        { error: { code: 'NOT_CONFIGURED', message: 'ورودِ تلگرام پیکربندی نشده است.' } },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { initData?: unknown };
    const initData = typeof body.initData === 'string' ? body.initData : '';

    const nowSeconds = Math.floor(c.now().getTime() / 1000);
    const result = verifyInitData(initData, c.telegram.sign, nowSeconds, MAX_AGE_SECONDS);
    if (!result.ok || !result.user) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'اعتبارسنجیِ تلگرام ناموفق بود.' } },
        { status: 401 },
      );
    }

    const token = completeTelegramLogin(authDeps(c), {
      id: result.user.id,
      firstName: result.user.firstName,
    });

    return new Response(JSON.stringify({ ok: true, displayName: result.user.firstName }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': sessionCookie(token) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
