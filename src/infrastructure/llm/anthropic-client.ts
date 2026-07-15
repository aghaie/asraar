/** فراخوان مشترک API پیام‌های Anthropic — بین موتور گفتگو و مترجم مشترک است. */
import { sseDataLines } from './sse';

export interface AnthropicRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

export async function anthropicComplete(req: AnthropicRequest): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`anthropic ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
  };
  return data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('\n');
}

/** نسخه‌ی جریانی — تکه‌ها را به onDelta می‌دهد و متن کامل را برمی‌گرداند. */
export async function anthropicCompleteStream(
  req: AnthropicRequest,
  onDelta: (text: string) => void,
): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      stream: true,
      messages: req.messages,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '');
    throw new Error(`anthropic ${response.status}: ${body.slice(0, 300)}`);
  }

  let full = '';
  for await (const payload of sseDataLines(response.body)) {
    try {
      const json = JSON.parse(payload) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
        const text = json.delta.text ?? '';
        if (text.length > 0) {
          full += text;
          onDelta(text);
        }
      }
    } catch {
      // سطر ناقص — نادیده
    }
  }
  return full;
}
