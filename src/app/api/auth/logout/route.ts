import { logout } from '@/core/usecases/auth/auth-service';
import { authDeps, clearSessionCookie, sessionTokenFrom } from '@/lib/auth';

export async function POST(request: Request): Promise<Response> {
  logout(authDeps(), sessionTokenFrom(request));
  return new Response(null, {
    status: 303,
    headers: { location: '/', 'set-cookie': clearSessionCookie() },
  });
}
