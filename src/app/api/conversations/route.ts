import { startConversation } from '@/core/usecases/start-conversation';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import { clientKeyFrom, errorResponse } from '@/lib/http';

export async function POST(request: Request): Promise<Response> {
  try {
    const c = getContainer();
    // اگر کاربر وارد شده باشد، گفتگو به بایگانی خصوصی او وصل می‌شود (اختیاری).
    const user = currentUser(request);
    const result = startConversation(c, clientKeyFrom(request, c.salt), user?.id ?? null);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
