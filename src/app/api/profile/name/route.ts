import { setDisplayName } from '@/core/usecases/auth/auth-service';
import { authDeps, currentUser } from '@/lib/auth';
import { errorResponse, readJsonBody, requireString } from '@/lib/http';
import { DomainError } from '@/core/domain/errors';

export async function POST(request: Request): Promise<Response> {
  try {
    const user = currentUser(request);
    if (!user) throw new DomainError('FORBIDDEN', 'ابتدا وارد شوید.');
    const body = await readJsonBody(request);
    const name = setDisplayName(authDeps(), user.id, requireString(body, 'name', 200));
    return Response.json({ ok: true, name });
  } catch (error) {
    return errorResponse(error);
  }
}
