import { LIMITS } from '@/core/domain/conversation';
import { DomainError } from '@/core/domain/errors';
import { sendMessage, type SendMessageInput } from '@/core/usecases/send-message';
import { getContainer } from '@/infrastructure/container';
import { currentUser } from '@/lib/auth';
import {
  clientKeyFrom,
  errorResponse,
  optionalString,
  readJsonBody,
  requireString,
} from '@/lib/http';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let input: SendMessageInput;
  try {
    const { id } = await params;
    const body = await readJsonBody(request);
    const c = getContainer();
    input = {
      conversationId: id,
      ownerToken: optionalString(body, 'ownerToken', 256),
      userId: currentUser(request)?.id ?? null,
      content: requireString(body, 'content', LIMITS.maxMessageChars + 1000),
      clientKey: clientKeyFrom(request, c.salt),
    };
  } catch (error) {
    return errorResponse(error);
  }

  const wantsStream = request.headers.get('accept')?.includes('text/event-stream');
  if (!wantsStream) {
    try {
      const result = await sendMessage(getContainer(), input);
      return Response.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  }

  // پاسخ جریانی (SSE): رویدادهای delta سپس done؛ خطا با رویداد error.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      try {
        const result = await sendMessage(getContainer(), input, (text) =>
          send('delta', { text }),
        );
        send('done', { turns: result.turns, turnsLeft: result.turnsLeft });
      } catch (error) {
        if (error instanceof DomainError) {
          send('error', { code: error.code, message: error.message });
        } else {
          console.error(
            JSON.stringify({
              level: 'error',
              msg: 'stream error',
              error: error instanceof Error ? error.message : String(error),
            }),
          );
          send('error', { code: 'INTERNAL', message: 'خطای داخلی رخ داد.' });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
