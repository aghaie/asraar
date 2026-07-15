import { completeGoogleLogin } from '@/core/usecases/auth/auth-service';
import { exchangeGoogleCode } from '@/infrastructure/auth/google-oauth';
import { getContainer } from '@/infrastructure/container';
import {
  authDeps,
  clearOauthStateCookie,
  OAUTH_STATE_COOKIE,
  readCookie,
  sessionCookie,
} from '@/lib/auth';

export async function GET(request: Request): Promise<Response> {
  const c = getContainer();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request, OAUTH_STATE_COOKIE);

  const fail = (reason: string) =>
    new Response(null, {
      status: 303,
      headers: { location: `/login?error=${reason}`, 'set-cookie': clearOauthStateCookie() },
    });

  if (!c.google) return fail('nogoogle');
  if (!code || !state || !expectedState || state !== expectedState) return fail('state');

  try {
    const profile = await exchangeGoogleCode(c.google, code);
    const sessionToken = completeGoogleLogin(authDeps(c), profile);
    const headers = new Headers({ location: '/profile' });
    headers.append('set-cookie', sessionCookie(sessionToken));
    headers.append('set-cookie', clearOauthStateCookie());
    return new Response(null, { status: 303, headers });
  } catch {
    return fail('google');
  }
}
