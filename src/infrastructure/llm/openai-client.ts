/** فراخوان مشترک Chat Completions مربوط به OpenAI — بین موتور گفتگو و مترجم مشترک است. */
import { sseDataLines } from './sse';

export interface OpenAiRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

/**
 * مدل‌های استدلالی (gpt-5*, o*) بخشی از سقف توکن را صرف استدلال درونی می‌کنند.
 * برای گفتگو، تلاش استدلال را پایین نگه می‌داریم تا پاسخ سریع و کامل برسد؛
 * وگرنه ممکن است کل بودجه صرف استدلال شود و متن خالی برگردد.
 */
function requestBody(req: OpenAiRequest, stream: boolean): Record<string, unknown> {
  const isReasoningModel = /^(gpt-5|o\d)/.test(req.model);
  return {
    model: req.model,
    max_completion_tokens: req.maxTokens,
    ...(stream ? { stream: true } : {}),
    ...(isReasoningModel
      ? { reasoning_effort: process.env.MONAD_REASONING_EFFORT ?? 'low' }
      : {}),
    messages: [{ role: 'system', content: req.system }, ...req.messages],
  };
}

export async function openAiComplete(req: OpenAiRequest): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com';
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify(requestBody(req, false)),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`openai ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices: { message?: { content?: string | null } }[];
  };
  return data.choices[0]?.message?.content ?? '';
}

/** نسخه‌ی جریانی — تکه‌ها را به onDelta می‌دهد و متن کامل را برمی‌گرداند. */
export async function openAiCompleteStream(
  req: OpenAiRequest,
  onDelta: (text: string) => void,
): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com';
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${req.apiKey}`,
    },
    body: JSON.stringify(requestBody(req, true)),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '');
    throw new Error(`openai ${response.status}: ${body.slice(0, 300)}`);
  }

  let full = '';
  for await (const payload of sseDataLines(response.body)) {
    if (payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: string | null } }[];
      };
      const delta = json.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta.length > 0) {
        full += delta;
        onDelta(delta);
      }
    } catch {
      // سطر ناقص/غیر JSON — نادیده
    }
  }
  return full;
}

