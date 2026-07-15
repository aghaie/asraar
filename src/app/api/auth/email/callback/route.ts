import { completeEmailLogin } from '@/core/usecases/auth/auth-service';
import { getContainer } from '@/infrastructure/container';
import { authDeps, sessionCookie } from '@/lib/auth';

export async function GET(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const c = getContainer();
  try {
    const sessionToken = completeEmailLogin(authDeps(c), token);
    return new Response(null, {
      status: 303,
      headers: { location: '/profile', 'set-cookie': sessionCookie(sessionToken) },
    });
  } catch {
    return new Response(null, {
      status: 303,
      headers: { location: '/login?error=invalid' },
    });
  }
}
