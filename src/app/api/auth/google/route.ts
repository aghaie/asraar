import { googleAuthUrl } from '@/infrastructure/auth/google-oauth';
import { getContainer } from '@/infrastructure/container';
import { oauthStateCookie } from '@/lib/auth';

export async function GET(): Promise<Response> {
  const c = getContainer();
  if (!c.google) {
    return new Response(null, { status: 303, headers: { location: '/login?error=nogoogle' } });
  }
  const state = c.newToken();
  return new Response(null, {
    status: 303,
    headers: {
      location: googleAuthUrl(c.google, state),
      'set-cookie': oauthStateCookie(state),
    },
  });
}
