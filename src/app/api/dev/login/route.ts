import { devLoginAs } from '@/core/usecases/auth/auth-service';
import { getContainer } from '@/infrastructure/container';
import { authDeps, sessionCookie } from '@/lib/auth';

/**
 * ورودِ خصوصیِ فقط-توسعه به پنل مدیریت (بدونِ لینکِ ایمیل).
 * — در production کاملاً غیرفعال است (۴۰۴).
 * — فقط ایمیل‌هایی که در `MONAD_ADMIN_EMAILS` هستند می‌توانند وارد شوند.
 * استفاده: مرورگر را ببر به `http://localhost:3000/api/dev/login`
 *          (یا برای ایمیلِ خاص: `.../api/dev/login?email=you@example.com`).
 * سپس مستقیم به `/admin` هدایت می‌شوی.
 */
export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }

  const admins = (process.env.MONAD_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (admins.length === 0) {
    return new Response(
      'MONAD_ADMIN_EMAILS تنظیم نشده است؛ ابتدا آن را در .env بگذار.',
      { status: 400 },
    );
  }

  const requested = (new URL(request.url).searchParams.get('email') ?? '')
    .trim()
    .toLowerCase();
  const email = requested || admins[0];
  if (!admins.includes(email)) {
    return new Response('این ایمیل ادمین نیست.', { status: 403 });
  }

  const token = devLoginAs(authDeps(getContainer()), email);
  return new Response(null, {
    status: 303,
    headers: { location: '/admin', 'set-cookie': sessionCookie(token) },
  });
}
