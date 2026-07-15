import { requestEmailLogin } from '@/core/usecases/auth/auth-service';
import { getContainer } from '@/infrastructure/container';
import { authDeps } from '@/lib/auth';
import { clientKeyFrom, errorResponse, readJsonBody, requireString } from '@/lib/http';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonBody(request);
    const email = requireString(body, 'email', 254);
    const c = getContainer();
    await requestEmailLogin(authDeps(c), email, clientKeyFrom(request, c.salt));
    // پاسخ یکنواخت تا وجود/عدم‌وجود حساب فاش نشود.
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
